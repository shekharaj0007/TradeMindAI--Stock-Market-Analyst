from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models import Order, User, WatchlistItem
from app.schemas import (
    AIAnalysisRequest,
    AIAnalysisResponse,
    JournalCreate,
    JournalResponse,
    LeaderboardEntry,
    OrderCreate,
    OrderResponse,
    PortfolioSummary,
    StockResearchRequest,
    WatchlistAdd,
)
from app.models import TradingJournalEntry
from app.services.ai_service import analyze_journal_entry, analyze_portfolio, earnings_summary, research_stock
from app.services.portfolio_service import execute_order, get_portfolio_summary
from app.services.stock_service import get_quote

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/summary", response_model=PortfolioSummary)
async def portfolio_summary(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_portfolio_summary(db, user)


@router.post("/orders", response_model=OrderResponse)
async def place_order(
    data: OrderCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        order = await execute_order(db, user, data.symbol, data.side.value, data.quantity)
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders", response_model=list[OrderResponse])
async def order_history(
    limit: int = Query(50, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc()).limit(limit)
    )
    return result.scalars().all()


@router.get("/watchlist")
async def get_watchlist(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WatchlistItem).where(WatchlistItem.user_id == user.id))
    items = result.scalars().all()
    quotes = []
    for item in items:
        try:
            quotes.append(await get_quote(item.symbol))
        except Exception:
            quotes.append({"symbol": item.symbol, "name": item.symbol, "price": 0, "change": 0, "change_percent": 0})
    return quotes


@router.post("/watchlist")
async def add_watchlist(
    data: WatchlistAdd,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symbol = data.symbol.upper().replace(".NS", "")
    existing = await db.execute(
        select(WatchlistItem).where(WatchlistItem.user_id == user.id, WatchlistItem.symbol == symbol)
    )
    if existing.scalar_one_or_none():
        return {"message": "Already in watchlist"}

    db.add(WatchlistItem(user_id=user.id, symbol=symbol))
    return {"message": "Added to watchlist"}


@router.delete("/watchlist/{symbol}")
async def remove_watchlist(
    symbol: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == user.id,
            WatchlistItem.symbol == symbol.upper(),
        )
    )
    item = result.scalar_one_or_none()
    if item:
        await db.delete(item)
    return {"message": "Removed"}


@router.post("/ai/analyze", response_model=AIAnalysisResponse)
async def ai_portfolio_analysis(
    data: AIAnalysisRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    summary = await get_portfolio_summary(db, user)
    symbols = data.symbols or [h["symbol"] for h in summary["holdings"]]
    if not symbols:
        symbols = data.symbols

    detail = "\n".join(
        f"- {h['symbol']}: {h['quantity']} shares @ ₹{h['avg_price']}" for h in summary["holdings"]
    ) or "No holdings yet. User wants analysis for: " + ", ".join(symbols)

    result = await analyze_portfolio(symbols, detail)
    return AIAnalysisResponse(**result)


@router.post("/ai/research")
async def ai_stock_research(data: StockResearchRequest, user: User = Depends(get_current_user)):
    try:
        quote = await get_quote(data.symbol)
    except Exception:
        raise HTTPException(status_code=404, detail="Stock not found")

    research = await research_stock(data.symbol, quote)
    return {"symbol": data.symbol, "quote": quote, "research": research}


@router.post("/ai/earnings/{symbol}")
async def ai_earnings(symbol: str, user: User = Depends(get_current_user)):
    summary = await earnings_summary(symbol)
    return {"symbol": symbol, "summary": summary}


@router.post("/journal", response_model=JournalResponse)
async def create_journal(
    data: JournalCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    feedback = await analyze_journal_entry(data.title, data.content)
    entry = TradingJournalEntry(
        user_id=user.id,
        title=data.title,
        content=data.content,
        ai_feedback=feedback,
    )
    db.add(entry)
    await db.flush()
    return entry


@router.get("/journal", response_model=list[JournalResponse])
async def list_journal(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TradingJournalEntry)
        .where(TradingJournalEntry.user_id == user.id)
        .order_by(TradingJournalEntry.created_at.desc())
    )
    return result.scalars().all()


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()

    entries = []
    for u in users:
        summary = await get_portfolio_summary(db, u)
        total = summary["virtual_balance"] + summary["current_value"]
        initial = settings.initial_virtual_balance
        pnl_pct = ((total - initial) / initial * 100) if initial else 0
        entries.append({
            "username": u.username,
            "total_value": round(total, 2),
            "pnl_percent": round(pnl_pct, 2),
        })

    entries.sort(key=lambda x: x["total_value"], reverse=True)
    return [
        LeaderboardEntry(rank=i + 1, **e)
        for i, e in enumerate(entries[:20])
    ]
