from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
import asyncio
import json

from app.services.stock_service import (
    get_candlesticks,
    get_market_news,
    get_popular_stocks,
    get_quote,
    search_stocks,
)
from app.services.signal_service import get_investment_picks, get_trading_signal
from app.schemas import InvestmentPick, TradingSignal

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/stocks")
async def popular_stocks():
    return await get_popular_stocks()


@router.get("/quote/{symbol}")
async def quote(symbol: str):
    try:
        return await get_quote(symbol)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    return await search_stocks(q)


@router.get("/candles/{symbol}")
async def candles(symbol: str, period: str = "3mo", interval: str = "1d"):
    try:
        return await get_candlesticks(symbol, interval, period)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/news")
async def news():
    return await get_market_news()


@router.get("/signals/{symbol}", response_model=TradingSignal)
async def trading_signal(symbol: str, interval: str = "1d"):
    try:
        return await get_trading_signal(symbol, interval)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/picks", response_model=list[InvestmentPick])
async def investment_picks(limit: int = Query(5, le=10)):
    return await get_investment_picks(limit)


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)


manager = ConnectionManager()


@router.websocket("/ws/prices")
async def price_feed(websocket: WebSocket, symbols: str = "RELIANCE,TATAMOTORS,HDFCBANK"):
    await manager.connect(websocket)
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]

    try:
        while True:
            quotes = []
            for sym in symbol_list:
                try:
                    quotes.append(await get_quote(sym))
                except Exception:
                    pass

            await websocket.send_json({"type": "prices", "data": quotes})
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/ws/live/{symbol}")
async def live_chart_feed(websocket: WebSocket, symbol: str, interval: str = "1d"):
    await manager.connect(websocket)
    period_map = {"1d": "6mo", "1h": "1mo", "15m": "5d", "5m": "5d"}
    period = period_map.get(interval, "3mo")

    try:
        while True:
            try:
                quote = await get_quote(symbol)
                candles = await get_candlesticks(symbol, interval, period)
                signal = await get_trading_signal(symbol, interval, include_ai=False)
                await websocket.send_json({
                    "type": "live",
                    "quote": quote,
                    "candles": candles[-120:],
                    "signal": {
                        "action": signal["action"],
                        "confidence": signal["confidence"],
                        "entry_price": signal["entry_price"],
                        "target_price": signal["target_price"],
                        "stop_loss": signal["stop_loss"],
                        "chart_markers": signal["chart_markers"],
                    },
                })
            except Exception as e:
                await websocket.send_json({"type": "error", "message": str(e)})
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
