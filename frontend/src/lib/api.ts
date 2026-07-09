const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9001/api";
export const WS_BASE = API_BASE.replace("/api", "");

function formatApiError(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : String(item)))
      .join(", ");
  }
  return "Request failed";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error(`Cannot connect to backend at ${API_BASE}. Start backend: uvicorn app.main:app --port 9001`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(formatApiError(err.detail));
  }

  return res.json();
}

export const api = {
  signup: (data: { email: string; username: string; password: string; full_name?: string }) =>
    request<{ access_token: string }>("/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { login: string; password: string }) =>
    request<{ access_token: string }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => request<User>("/auth/me"),

  portfolio: () => request<PortfolioSummary>("/portfolio/summary"),

  placeOrder: (data: { symbol: string; side: "BUY" | "SELL"; quantity: number }) =>
    request<Order>("/portfolio/orders", { method: "POST", body: JSON.stringify(data) }),

  orders: () => request<Order[]>("/portfolio/orders"),

  watchlist: () => request<StockQuote[]>("/portfolio/watchlist"),

  addWatchlist: (symbol: string) =>
    request<{ message: string }>("/portfolio/watchlist", { method: "POST", body: JSON.stringify({ symbol }) }),

  removeWatchlist: (symbol: string) =>
    request<{ message: string }>(`/portfolio/watchlist/${symbol}`, { method: "DELETE" }),

  aiAnalyze: (symbols: string[]) =>
    request<AIAnalysis>("/portfolio/ai/analyze", { method: "POST", body: JSON.stringify({ symbols }) }),

  aiResearch: (symbol: string) =>
    request<{ symbol: string; quote: StockQuote; research: string }>("/portfolio/ai/research", {
      method: "POST",
      body: JSON.stringify({ symbol }),
    }),

  journal: () => request<JournalEntry[]>("/portfolio/journal"),

  createJournal: (data: { title: string; content: string }) =>
    request<JournalEntry>("/portfolio/journal", { method: "POST", body: JSON.stringify(data) }),

  leaderboard: () => request<LeaderboardEntry[]>("/portfolio/leaderboard"),

  stocks: () => request<StockQuote[]>("/market/stocks"),

  quote: (symbol: string) => request<StockQuote>(`/market/quote/${symbol}`),

  search: (q: string) => request<StockQuote[]>(`/market/search?q=${encodeURIComponent(q)}`),

  candles: (symbol: string, period = "3mo", interval = "1d") =>
    request<Candle[]>(`/market/candles/${symbol}?period=${period}&interval=${interval}`),

  news: () => request<NewsItem[]>("/market/news"),

  signal: (symbol: string, interval = "1d") =>
    request<TradingSignal>(`/market/signals/${symbol}?interval=${interval}`),

  picks: () => request<InvestmentPick[]>("/market/picks?limit=5"),
};

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_premium: boolean;
  virtual_balance: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  market_value: number;
  pnl: number;
  pnl_percent: number;
}

export interface PortfolioSummary {
  virtual_balance: number;
  invested_value: number;
  current_value: number;
  total_pnl: number;
  total_pnl_percent: number;
  holdings: Holding[];
}

export interface Order {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  status: string;
  created_at: string;
}

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
}

export interface AIAnalysis {
  analysis: string;
  risk_score: number;
  suggestions: string[];
}

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  ai_feedback: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  total_value: number;
  pnl_percent: number;
}

export interface TradingSignal {
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
  ai_advice?: string;
  indicators: { rsi: number | null; sma20: number | null; sma50: number | null; trend: string };
  chart_markers: { time: string; position: string; color: string; shape: string; text: string }[];
  disclaimer: string;
  quote?: StockQuote;
}

export interface InvestmentPick {
  symbol: string;
  name: string;
  action: string;
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
}

export function liveChartWsUrl(symbol: string, interval: string): string {
  const ws = WS_BASE.replace("http://", "ws://").replace("https://", "wss://");
  return `${ws}/api/market/ws/live/${symbol}?interval=${interval}`;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

export function formatPercent(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}
