from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./trademind.db"
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "dev-secret-change-in-production"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    ai_model: str = "claude-sonnet-4-6"
    alpha_vantage_api_key: str = ""
    initial_virtual_balance: float = 1_000_000.0
    access_token_expire_minutes: int = 60 * 24 * 7
    offline_market: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
