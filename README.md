# TradeMind AI

**Zerodha-style paper trading platform with AI portfolio intelligence** — built for IIT Patna placement portfolios.

> Educational simulation only. No real brokerage. No SEBI-regulated transactions.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![Stack](https://img.shields.io/badge/FastAPI-Python-009688) ![Stack](https://img.shields.io/badge/PostgreSQL-16-336791) ![Stack](https://img.shields.io/badge/Redis-7-DC382D)

## Why This Project Stands Out

| Level | What You Built |
|-------|----------------|
| **Level 1** | Zerodha clone — auth, portfolio, watchlist, live prices, charts, buy/sell simulation, P&L, orders, news |
| **Level 2** | AI portfolio advisor, stock research, trading journal with AI feedback, risk scoring |
| **Resume** | Full-stack, WebSockets, Redis caching, cloud-deployable, startup-quality UI |

# 📸 Application Screenshots

## 📊 Dashboard

![Dashboard](assets/dashboard.png)

---

## 📈 Market Overview

![Market Overview](assets/market-overview.png)

---

## 🤖 AI Stock Analysis

![AI Stock Analysis](assets/stock-analysis.png)

---

## 📉 Technical Analysis

![Technical Analysis](assets/technical-analysis.png)

---

## 🔮 AI Prediction

![Prediction](assets/prediction.png)

---

## 💼 Portfolio Analytics

![Portfolio](assets/portfolio.png)

---

## 📰 Financial News

![Financial News](assets/news.png)

---

## 💬 Market Sentiment

![Market Sentiment](assets/sentiment.png)

## Features

### Paper Trading (Level 1)
- User signup/login with JWT auth
- Virtual ₹10,00,000 starting balance
- Buy/sell simulation with instant execution
- Portfolio dashboard with real-time P&L
- Watchlist with live NSE prices
- Candlestick charts (TradingView Lightweight Charts)
- Order history
- Market news feed
- Leaderboards

### AI Intelligence (Level 2)
- **AI Portfolio Advisor** — concentration risk, diversification suggestions
- **AI Stock Research** — per-stock analysis
- **AI Trading Journal** — coach feedback on your entries
- Works with OpenAI API; intelligent fallback when no key is set

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL |
| Cache | Redis (price caching) |
| Real-time | WebSockets (live price feed) |
| Charts | Lightweight Charts (TradingView) |
| Market Data | Yahoo Finance (yfinance) |
| AI | OpenAI GPT-4o-mini |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (for PostgreSQL & Redis)

### 1. Start databases (optional — production)

For local development, the backend uses **SQLite by default** (no Docker needed).

For production with PostgreSQL + Redis:

```bash
docker compose up -d
# Set DATABASE_URL=postgresql+asyncpg://... and pip install asyncpg
```

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # edit with your keys
uvicorn app.main:app --reload --port 8080
```

API docs: http://localhost:8080/docs

### 3. Frontend

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

App: http://localhost:3000

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | JWT signing key |
| `OPENAI_API_KEY` | Optional — enables full AI features |
| `INITIAL_VIRTUAL_BALANCE` | Starting cash (default ₹10,00,000) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default `http://localhost:8080/api`) |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── routers/             # API routes
│   │   └── services/            # Stock, portfolio, AI logic
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/                 # Next.js pages
│       ├── components/          # UI components
│       └── lib/                 # API client, auth
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/portfolio/summary` | Portfolio & P&L |
| POST | `/api/portfolio/orders` | Place buy/sell order |
| POST | `/api/portfolio/ai/analyze` | AI portfolio analysis |
| GET | `/api/market/stocks` | Popular NSE stocks |
| GET | `/api/market/candles/{symbol}` | OHLCV data |
| WS | `/api/market/ws/prices` | Live price WebSocket |

## Deployment (Cloud)

### Backend — Railway / Render / Fly.io
1. Add PostgreSQL and Redis add-ons
2. Set environment variables
3. Deploy with: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend — Vercel
1. Connect GitHub repo
2. Set `NEXT_PUBLIC_API_URL` to your deployed backend
3. Deploy

## Resume Bullet Points

- Built **TradeMind AI**, a full-stack paper trading platform with Zerodha-inspired UI serving live NSE market data
- Implemented virtual portfolio engine with P&L tracking, order matching, and Redis-cached price feeds over WebSockets
- Integrated **OpenAI-powered portfolio advisor** for concentration risk analysis and diversification recommendations
- Stack: Next.js, FastAPI, PostgreSQL, Redis — deployed on cloud with JWT auth and REST + WebSocket APIs

## Disclaimer

This is a **learning and simulation platform**. It does not execute real trades, hold real money, or provide licensed financial advice. Not affiliated with Zerodha or any broker.

## License

MIT
