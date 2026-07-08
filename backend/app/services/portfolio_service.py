from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Order, OrderSide, OrderStatus, PortfolioHolding, User
from app.services.stock_service import get_quote, normalize_symbol


async def execute_order(db: AsyncSession, user: User, symbol: str, side: str, quantity: int) -> Order:
    symbol = normalize_symbol(symbol)
    quote = await get_quote(symbol)
    price = quote["price"]
    total = price * quantity
    display_symbol = symbol.replace(".NS", "").replace(".BO", "")

    if side == OrderSide.BUY.value:
        if user.virtual_balance < total:
            raise ValueError(f"Insufficient balance. Need ₹{total:,.2f}, have ₹{user.virtual_balance:,.2f}")

        user.virtual_balance -= total

        result = await db.execute(
            select(PortfolioHolding).where(
                PortfolioHolding.user_id == user.id,
                PortfolioHolding.symbol == display_symbol,
            )
        )
        holding = result.scalar_one_or_none()

        if holding:
            new_qty = holding.quantity + quantity
            holding.avg_price = ((holding.avg_price * holding.quantity) + total) / new_qty
            holding.quantity = new_qty
        else:
            db.add(PortfolioHolding(
                user_id=user.id,
                symbol=display_symbol,
                quantity=quantity,
                avg_price=price,
            ))

    elif side == OrderSide.SELL.value:
        result = await db.execute(
            select(PortfolioHolding).where(
                PortfolioHolding.user_id == user.id,
                PortfolioHolding.symbol == display_symbol,
            )
        )
        holding = result.scalar_one_or_none()

        if not holding or holding.quantity < quantity:
            raise ValueError(f"Insufficient shares. Have {holding.quantity if holding else 0}, need {quantity}")

        user.virtual_balance += total
        holding.quantity -= quantity

        if holding.quantity == 0:
            await db.delete(holding)

    order = Order(
        user_id=user.id,
        symbol=display_symbol,
        side=OrderSide(side),
        quantity=quantity,
        price=price,
        status=OrderStatus.EXECUTED,
    )
    db.add(order)
    await db.flush()
    return order


async def get_portfolio_summary(db: AsyncSession, user: User) -> dict:
    result = await db.execute(
        select(PortfolioHolding).where(PortfolioHolding.user_id == user.id)
    )
    holdings = result.scalars().all()

    holding_details = []
    invested = 0.0
    current = 0.0

    for h in holdings:
        try:
            quote = await get_quote(h.symbol)
            cp = quote["price"]
        except Exception:
            cp = h.avg_price

        mv = cp * h.quantity
        cost = h.avg_price * h.quantity
        pnl = mv - cost
        pnl_pct = (pnl / cost * 100) if cost else 0

        invested += cost
        current += mv

        holding_details.append({
            "symbol": h.symbol,
            "quantity": h.quantity,
            "avg_price": round(h.avg_price, 2),
            "current_price": round(cp, 2),
            "market_value": round(mv, 2),
            "pnl": round(pnl, 2),
            "pnl_percent": round(pnl_pct, 2),
        })

    total_pnl = current - invested
    total_pnl_pct = (total_pnl / invested * 100) if invested else 0

    return {
        "virtual_balance": round(user.virtual_balance, 2),
        "invested_value": round(invested, 2),
        "current_value": round(current, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_percent": round(total_pnl_pct, 2),
        "holdings": holding_details,
    }
