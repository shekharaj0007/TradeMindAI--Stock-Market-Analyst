import asyncio
import json
from datetime import datetime, timedelta

import yfinance as yf

from app.config import settings

INDIAN_STOCKS = {
    "RELIANCE.NS": "Reliance Industries",
    "TATAMOTORS.NS": "Tata Motors",
    "HDFCBANK.NS": "HDFC Bank",
    "INFY.NS": "Infosys",
    "TCS.NS": "Tata Consultancy Services",
    "ICICIBANK.NS": "ICICI Bank",
    "SBIN.NS": "State Bank of India",
    "BHARTIARTL.NS": "Bharti Airtel",
    "ITC.NS": "ITC Limited",
    "WIPRO.NS": "Wipro",
    "LT.NS": "Larsen & Toubro",
    "AXISBANK.NS": "Axis Bank",
    "MARUTI.NS": "Maruti Suzuki",
    "BAJFINANCE.NS": "Bajaj Finance",
    "HINDUNILVR.NS": "Hindustan Unilever",
}

FALLBACK_PRICES = {
    "RELIANCE.NS": 1450.0,
    "TATAMOTORS.NS": 980.0,
    "HDFCBANK.NS": 1680.0,
    "INFY.NS": 1850.0,
    "TCS.NS": 4100.0,
    "ICICIBANK.NS": 1250.0,
    "SBIN.NS": 820.0,
    "BHARTIARTL.NS": 1580.0,
    "ITC.NS": 465.0,
    "WIPRO.NS": 520.0,
    "LT.NS": 3650.0,
    "AXISBANK.NS": 1150.0,
    "MARUTI.NS": 12500.0,
    "BAJFINANCE.NS": 7200.0,
    "HINDUNILVR.NS": 2380.0,
}

FETCH_TIMEOUT = 3

_memory_cache: dict[str, tuple[float, str]] = {}
_redis_client = None


async def _cache_get(key: str) -> str | None:
    global _redis_client
    try:
        if _redis_client is None:
            import redis.asyncio as redis
            _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        return await _redis_client.get(key)
    except Exception:
        entry = _memory_cache.get(key)
        if entry and entry[0] > datetime.utcnow().timestamp():
            return entry[1]
        return None


async def _cache_set(key: str, value: str, ttl: int):
    global _redis_client
    try:
        if _redis_client is None:
            import redis.asyncio as redis
            _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        await _redis_client.setex(key, ttl, value)
    except Exception:
        _memory_cache[key] = (datetime.utcnow().timestamp() + ttl, value)


def normalize_symbol(symbol: str) -> str:
    symbol = symbol.upper().strip()
    if not symbol.endswith(".NS") and not symbol.endswith(".BO"):
        symbol = f"{symbol}.NS"
    return symbol


def _fetch_quote_sync(symbol: str) -> dict:
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="5d")
    if hist.empty:
        raise ValueError(f"No data for {symbol}")

    current = float(hist["Close"].iloc[-1])
    prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current
    change = current - prev
    change_pct = (change / prev * 100) if prev else 0

    return {
        "symbol": symbol.replace(".NS", "").replace(".BO", ""),
        "name": INDIAN_STOCKS.get(symbol, symbol),
        "price": round(current, 2),
        "change": round(change, 2),
        "change_percent": round(change_pct, 2),
        "volume": int(hist["Volume"].iloc[-1]) if "Volume" in hist else None,
        "high": round(float(hist["High"].iloc[-1]), 2),
        "low": round(float(hist["Low"].iloc[-1]), 2),
        "open": round(float(hist["Open"].iloc[-1]), 2),
    }


def _fallback_quote(symbol: str) -> dict:
    price = FALLBACK_PRICES.get(symbol, 1000.0)
    return {
        "symbol": symbol.replace(".NS", "").replace(".BO", ""),
        "name": INDIAN_STOCKS.get(symbol, symbol),
        "price": price,
        "change": round(price * 0.005, 2),
        "change_percent": 0.5,
        "volume": 1_000_000,
        "high": round(price * 1.01, 2),
        "low": round(price * 0.99, 2),
        "open": price,
    }


async def get_quote(symbol: str) -> dict:
    symbol = normalize_symbol(symbol)
    cache_key = f"quote:{symbol}"

    cached = await _cache_get(cache_key)
    if cached:
        return json.loads(cached)

    if settings.offline_market:
        quote = _fallback_quote(symbol)
    else:
        try:
            quote = await asyncio.wait_for(asyncio.to_thread(_fetch_quote_sync, symbol), timeout=FETCH_TIMEOUT)
        except Exception:
            quote = _fallback_quote(symbol)

    await _cache_set(cache_key, json.dumps(quote), 120)
    return quote


async def get_quotes(symbols: list[str]) -> list[dict]:
    tasks = [get_quote(sym) for sym in symbols]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [r for r in results if isinstance(r, dict)]


def _fetch_candles_sync(symbol: str, interval: str, period: str) -> list[dict]:
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period, interval=interval)
    candles = []
    for idx, row in hist.iterrows():
        candles.append({
            "timestamp": idx.isoformat(),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
        })
    return candles


def _fallback_candles(symbol: str, days: int = 90) -> list[dict]:
    price = FALLBACK_PRICES.get(symbol, 1000.0)
    candles = []
    for i in range(days, 0, -1):
        dt = datetime.utcnow() - timedelta(days=i)
        p = price * (1 + (i % 7 - 3) * 0.005)
        candles.append({
            "timestamp": dt.isoformat(),
            "open": round(p * 0.998, 2),
            "high": round(p * 1.012, 2),
            "low": round(p * 0.988, 2),
            "close": round(p, 2),
            "volume": 500_000 + i * 1000,
        })
    return candles


async def get_candlesticks(symbol: str, interval: str = "1d", period: str = "3mo") -> list[dict]:
    symbol = normalize_symbol(symbol)
    cache_key = f"candles:{symbol}:{interval}:{period}"

    cached = await _cache_get(cache_key)
    if cached:
        return json.loads(cached)

    if settings.offline_market:
        candles = _fallback_candles(symbol)
    else:
        try:
            candles = await asyncio.wait_for(
                asyncio.to_thread(_fetch_candles_sync, symbol, interval, period),
                timeout=FETCH_TIMEOUT,
            )
            if not candles:
                raise ValueError("empty")
        except Exception:
            candles = _fallback_candles(symbol)

    await _cache_set(cache_key, json.dumps(candles), 300)
    return candles


async def search_stocks(query: str) -> list[dict]:
    query = query.upper()
    matches = []
    for symbol, name in INDIAN_STOCKS.items():
        short = symbol.replace(".NS", "")
        if query in short or query in name.upper():
            try:
                quote = await get_quote(symbol)
                matches.append(quote)
            except Exception:
                matches.append(_fallback_quote(symbol))
    return matches[:10]


async def get_market_news() -> list[dict]:
    cache_key = "market:news"
    cached = await _cache_get(cache_key)
    if cached:
        return json.loads(cached)

    news = [{
        "title": "Indian markets open steady amid global cues",
        "summary": "Nifty and Sensex trade in narrow range as investors await RBI policy signals.",
        "source": "TradeMind AI",
        "url": "#",
        "published_at": datetime.utcnow().isoformat(),
    }, {
        "title": "IT stocks gain on strong Q4 earnings expectations",
        "summary": "Infosys and TCS lead sector gains in morning trade.",
        "source": "TradeMind AI",
        "url": "#",
        "published_at": datetime.utcnow().isoformat(),
    }]

    await _cache_set(cache_key, json.dumps(news), 600)
    return news


async def get_popular_stocks() -> list[dict]:
    symbols = list(INDIAN_STOCKS.keys())[:8]
    return await get_quotes(symbols)
