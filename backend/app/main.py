from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, market, portfolio


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="TradeMind AI",
    description="Paper trading platform with AI portfolio advisor",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:9000",
        "http://localhost:9001",
        "http://127.0.0.1:9001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(market.router, prefix="/api")


@app.get("/")
async def root():
    return {"name": "TradeMind AI", "status": "running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
