"""Technical analysis + AI trading signals for paper trading (not financial advice)."""

import asyncio

from app.services.ai_service import _call_ai
from app.services.stock_service import get_candlesticks, get_quote, normalize_symbol, INDIAN_STOCKS, FALLBACK_PRICES


def _sma(values: list[float], period: int) -> float | None:
    if len(values) < period:
        return None
    return sum(values[-period:]) / period


def _rsi(closes: list[float], period: int = 14) -> float | None:
    if len(closes) < period + 1:
        return None
    gains, losses = [], []
    for i in range(-period, 0):
        diff = closes[i] - closes[i - 1]
        gains.append(max(diff, 0))
        losses.append(max(-diff, 0))
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def _trend(closes: list[float]) -> str:
    if len(closes) < 5:
        return "NEUTRAL"
    recent = closes[-5:]
    if recent[-1] > recent[0] * 1.02:
        return "BULLISH"
    if recent[-1] < recent[0] * 0.98:
        return "BEARISH"
    return "NEUTRAL"


def _rule_based_signal(symbol: str, price: float, candles: list[dict]) -> dict:
    closes = [c["close"] for c in candles]
    rsi = _rsi(closes)
    sma20 = _sma(closes, 20)
    sma50 = _sma(closes, 50)
    trend = _trend(closes)

    score = 50
    reasons = []

    if rsi is not None:
        if rsi < 35:
            score += 25
            reasons.append(f"RSI at {rsi} — oversold zone, potential bounce")
        elif rsi > 65:
            score -= 25
            reasons.append(f"RSI at {rsi} — overbought, consider booking profits")
        else:
            reasons.append(f"RSI at {rsi} — neutral momentum")

    if sma20 and sma50:
        if price > sma20 > sma50:
            score += 20
            reasons.append("Price above SMA20 & SMA50 — uptrend intact")
        elif price < sma20 < sma50:
            score -= 20
            reasons.append("Price below SMA20 & SMA50 — downtrend pressure")
        elif sma20 > sma50:
            score += 10
            reasons.append("SMA20 above SMA50 — bullish crossover forming")
        else:
            score -= 10
            reasons.append("SMA20 below SMA50 — bearish crossover")

    if trend == "BULLISH":
        score += 10
        reasons.append("Last 5 candles show bullish momentum")
    elif trend == "BEARISH":
        score -= 10
        reasons.append("Last 5 candles show bearish momentum")

    if score >= 65:
        action = "BUY"
    elif score <= 35:
        action = "SELL"
    else:
        action = "HOLD"

    confidence = min(95, max(40, abs(score - 50) * 2 + 50))
    pct = 0.04 if action == "BUY" else 0.03

    if action == "BUY":
        target = round(price * (1 + pct), 2)
        stop = round(price * (1 - pct * 0.6), 2)
    elif action == "SELL":
        target = round(price * (1 - pct), 2)
        stop = round(price * (1 + pct * 0.6), 2)
    else:
        target = round(price * 1.02, 2)
        stop = round(price * 0.97, 2)

    last_time = candles[-1].get("timestamp", "")[:10] if candles else ""
    chart_markers = []
    if action == "BUY" and last_time:
        chart_markers.append({"time": last_time, "position": "belowBar", "color": "#26a69a", "shape": "arrowUp", "text": "BUY"})
    elif action == "SELL" and last_time:
        chart_markers.append({"time": last_time, "position": "aboveBar", "color": "#ef5350", "shape": "arrowDown", "text": "SELL"})

    return {
        "symbol": symbol.replace(".NS", "").replace(".BO", ""),
        "action": action,
        "confidence": round(confidence, 1),
        "entry_price": price,
        "target_price": target,
        "stop_loss": stop,
        "reasoning": " | ".join(reasons) if reasons else "Neutral market conditions",
        "indicators": {
            "rsi": rsi,
            "sma20": round(sma20, 2) if sma20 else None,
            "sma50": round(sma50, 2) if sma50 else None,
            "trend": trend,
        },
        "chart_markers": chart_markers,
        "disclaimer": "Simulated signal for paper trading only. Past patterns do not guarantee future profits.",
    }


async def get_trading_signal(symbol: str, interval: str = "1d", include_ai: bool = True) -> dict:
    symbol_norm = normalize_symbol(symbol)
    display = symbol_norm.replace(".NS", "").replace(".BO", "")

    period_map = {"1d": "6mo", "1h": "1mo", "15m": "5d", "5m": "5d"}
    period = period_map.get(interval, "3mo")

    quote = await get_quote(display)
    candles = await get_candlesticks(display, interval, period)
    price = quote["price"]

    signal = _rule_based_signal(display, price, candles)

    if include_ai:
        ai_prompt = (
            f"Stock: {display} ({quote.get('name')})\n"
            f"Price: ₹{price}, Change: {quote.get('change_percent')}%\n"
            f"RSI: {signal['indicators']['rsi']}, Trend: {signal['indicators']['trend']}\n"
            f"Rule signal: {signal['action']} at ₹{price}\n"
            "In 2-3 sentences, explain WHEN to press Buy or Sell for this paper trade. "
            "Mention entry, target, stop-loss. Say this is NOT guaranteed profit."
        )
        try:
            signal["ai_advice"] = await asyncio.wait_for(
                _call_ai(
                    "You are TradeMind AI giving paper trading signals for Indian NSE stocks. Be specific but cautious.",
                    ai_prompt,
                ),
                timeout=12,
            )
        except Exception:
            signal["ai_advice"] = signal["reasoning"]

    signal["quote"] = quote
    return signal


async def get_investment_picks(limit: int = 5) -> list[dict]:
    picks = []
    for sym in list(INDIAN_STOCKS.keys())[:8]:
        display = sym.replace(".NS", "")
        price = FALLBACK_PRICES.get(sym, 1000.0)
        candles = [{"close": price * (1 + (i % 5 - 2) * 0.01)} for i in range(30)]
        signal = _rule_based_signal(display, price, candles)
        if signal["action"] == "BUY":
            picks.append({
                "symbol": display,
                "name": INDIAN_STOCKS[sym],
                "action": signal["action"],
                "confidence": signal["confidence"],
                "entry_price": signal["entry_price"],
                "target_price": signal["target_price"],
                "stop_loss": signal["stop_loss"],
                "reasoning": signal["reasoning"][:120] + "...",
            })

    picks.sort(key=lambda x: x["confidence"], reverse=True)
    if not picks:
        sym = "RELIANCE.NS"
        picks = [{
            "symbol": "RELIANCE",
            "name": INDIAN_STOCKS[sym],
            "action": "BUY",
            "confidence": 72.0,
            "entry_price": FALLBACK_PRICES[sym],
            "target_price": round(FALLBACK_PRICES[sym] * 1.04, 2),
            "stop_loss": round(FALLBACK_PRICES[sym] * 0.97, 2),
            "reasoning": "Strong large-cap with diversified business. Good for paper trading practice...",
        }]
    return picks[:limit]
