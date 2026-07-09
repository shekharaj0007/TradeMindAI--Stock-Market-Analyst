import { InvestmentPick, NewsItem, StockQuote } from "./api";

export const DEMO_STOCKS: StockQuote[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 1450, change: 7.25, change_percent: 0.5 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 4100, change: 20.5, change_percent: 0.5 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1680, change: 8.4, change_percent: 0.5 },
  { symbol: "INFY", name: "Infosys", price: 1850, change: 9.25, change_percent: 0.5 },
  { symbol: "TATAMOTORS", name: "Tata Motors", price: 980, change: 4.9, change_percent: 0.5 },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 1250, change: 6.25, change_percent: 0.5 },
  { symbol: "SBIN", name: "State Bank of India", price: 820, change: 4.1, change_percent: 0.5 },
  { symbol: "ITC", name: "ITC Limited", price: 465, change: 2.32, change_percent: 0.5 },
];

export const DEMO_NEWS: NewsItem[] = [
  {
    title: "Indian markets open steady amid global cues",
    summary: "Nifty and Sensex trade in narrow range.",
    source: "TradeMind AI",
    url: "#",
    published_at: new Date().toISOString(),
  },
  {
    title: "IT stocks gain on strong earnings expectations",
    summary: "Infosys and TCS lead sector gains.",
    source: "TradeMind AI",
    url: "#",
    published_at: new Date().toISOString(),
  },
];

export const DEMO_PICKS: InvestmentPick[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    action: "BUY",
    confidence: 72,
    entry_price: 1450,
    target_price: 1508,
    stop_loss: 1415,
    reasoning: "Large-cap stability with diversified business...",
  },
];
