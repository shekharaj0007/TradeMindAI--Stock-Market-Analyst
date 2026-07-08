from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    full_name: str | None = None


class UserLogin(BaseModel):
    login: str = Field(min_length=3, description="Email or username")
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str | None
    is_premium: bool
    virtual_balance: float

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OrderCreate(BaseModel):
    symbol: str
    side: OrderSide
    quantity: int = Field(gt=0)


class OrderResponse(BaseModel):
    id: int
    symbol: str
    side: OrderSide
    quantity: int
    price: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class HoldingResponse(BaseModel):
    symbol: str
    quantity: int
    avg_price: float
    current_price: float
    market_value: float
    pnl: float
    pnl_percent: float


class PortfolioSummary(BaseModel):
    virtual_balance: float
    invested_value: float
    current_value: float
    total_pnl: float
    total_pnl_percent: float
    holdings: list[HoldingResponse]


class WatchlistAdd(BaseModel):
    symbol: str


class StockQuote(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int | None = None
    high: float | None = None
    low: float | None = None
    open: float | None = None


class Candlestick(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class NewsItem(BaseModel):
    title: str
    summary: str
    source: str
    url: str
    published_at: str


class AIAnalysisRequest(BaseModel):
    symbols: list[str] = Field(min_length=1)


class AIAnalysisResponse(BaseModel):
    analysis: str
    risk_score: float
    suggestions: list[str]


class StockResearchRequest(BaseModel):
    symbol: str


class JournalCreate(BaseModel):
    title: str
    content: str


class JournalResponse(BaseModel):
    id: int
    title: str
    content: str
    ai_feedback: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    total_value: float
    pnl_percent: float


class TradingSignal(BaseModel):
    symbol: str
    action: str
    confidence: float
    entry_price: float
    target_price: float
    stop_loss: float
    reasoning: str
    ai_advice: str | None = None
    indicators: dict
    chart_markers: list[dict] = []
    disclaimer: str
    quote: StockQuote | None = None


class InvestmentPick(BaseModel):
    symbol: str
    name: str
    action: str
    confidence: float
    entry_price: float
    target_price: float
    stop_loss: float
    reasoning: str
