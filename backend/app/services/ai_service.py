from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

from app.config import settings

anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
openai_client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None


async def _call_ai(system: str, user: str) -> str:
    if anthropic_client:
        response = await anthropic_client.messages.create(
            model=settings.ai_model,
            max_tokens=1000,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return response.content[0].text if response.content else ""

    if openai_client:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.7,
            max_tokens=1000,
        )
        return response.choices[0].message.content or ""

    return _fallback_analysis(user)


def _fallback_analysis(prompt: str) -> str:
    if "portfolio" in prompt.lower() or any(s in prompt.upper() for s in ["RELIANCE", "TATAMOTORS", "HDFC"]):
        return (
            "Portfolio concentration risk is high in Indian large-cap equities. "
            "Your holdings are heavily weighted toward banking and auto sectors. "
            "Consider diversification into IT (INFY, TCS) or international ETFs. "
            "Maintain 10-15% cash buffer for volatility. "
            "Set stop-losses at 8-10% below entry for risk management."
        )
    return (
        "Based on recent market trends, maintain a diversified portfolio across sectors. "
        "Monitor earnings announcements and global macro factors. "
        "This is simulated analysis—not financial advice."
    )


async def analyze_portfolio(symbols: list[str], holdings_detail: str) -> dict:
    system = (
        "You are TradeMind AI, an expert Indian stock market analyst for a paper trading platform. "
        "Provide concise, actionable portfolio analysis. Include risk assessment (0-100 score). "
        "Focus on sector concentration, diversification, and Indian market context. "
        "End with 3 bullet-point suggestions. Not financial advice."
    )
    user = f"Analyze this portfolio:\nSymbols: {', '.join(symbols)}\n\nHoldings:\n{holdings_detail}"

    analysis = await _call_ai(system, user)

    risk_score = min(90, 40 + len(symbols) * 5)
    if len(symbols) <= 2:
        risk_score = 75
    elif len(symbols) <= 4:
        risk_score = 55

    suggestions = []
    for line in analysis.split("\n"):
        line = line.strip().lstrip("-•* ")
        if line and (line[0].isdigit() or "consider" in line.lower() or "diversify" in line.lower()):
            suggestions.append(line)
    if not suggestions:
        suggestions = [
            "Diversify across at least 5 sectors",
            "Keep 10-15% cash for opportunities",
            "Review portfolio monthly",
        ]

    return {"analysis": analysis, "risk_score": float(risk_score), "suggestions": suggestions[:5]}


async def research_stock(symbol: str, quote_data: dict) -> str:
    system = (
        "You are TradeMind AI stock research assistant for Indian markets. "
        "Provide a brief research summary: business overview, recent performance, "
        "key risks, and sentiment. Keep it under 300 words. Not financial advice."
    )
    user = f"Research {symbol}:\nPrice: ₹{quote_data.get('price')}\nChange: {quote_data.get('change_percent')}%\nName: {quote_data.get('name')}"
    return await _call_ai(system, user)


async def analyze_journal_entry(title: str, content: str) -> str:
    system = (
        "You are a trading coach reviewing a paper trading journal entry. "
        "Give constructive feedback on decision-making, emotional discipline, and learning points. "
        "Be encouraging but honest. Under 200 words."
    )
    user = f"Title: {title}\n\nEntry:\n{content}"
    return await _call_ai(system, user)


async def earnings_summary(symbol: str) -> str:
    system = "Summarize typical earnings considerations for Indian stocks. Be concise."
    user = f"Provide an earnings analysis framework for {symbol} (Indian stock, NSE)."
    return await _call_ai(system, user)
