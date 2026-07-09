import Link from "next/link";
import { TrendingUp, Brain, Shield, BarChart3, Users, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f1117]">
      <header className="border-b border-[#2a2d35] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#387ed1]">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">TradeMind AI</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:text-white">
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#387ed1] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d6bb5]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#387ed1]/30 bg-[#387ed1]/10 px-4 py-1.5 text-xs text-[#387ed1]">
          <Zap className="h-3 w-3" /> Paper Trading · AI-Powered · IIT Patna Ready
        </div>
        <h1 className="mb-6 text-5xl font-bold leading-tight text-white">
          Learn Trading with
          <br />
          <span className="text-[#387ed1]">AI Portfolio Intelligence</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400">
          Zerodha-style paper trading platform with live NSE prices, candlestick charts,
          virtual ₹10L portfolio, and AI advisor — no real money, no regulatory risk.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-[#387ed1] px-8 py-3 font-semibold text-white hover:bg-[#2d6bb5]"
          >
            Start Paper Trading
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-[#2a2d35] px-8 py-3 font-semibold text-zinc-300 hover:border-zinc-500"
          >
            Login
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {[
          { icon: BarChart3, title: "Live Market Data", desc: "Real NSE prices, candlestick charts, watchlists & market news via Yahoo Finance." },
          { icon: Brain, title: "AI Portfolio Advisor", desc: "Upload holdings — get concentration risk analysis, diversification tips & research." },
          { icon: Shield, title: "100% Simulated", desc: "Virtual ₹10,00,000 balance. Buy/sell without brokerage accounts or SEBI compliance." },
          { icon: TrendingUp, title: "P&L Tracking", desc: "Real-time profit/loss, order history, and portfolio dashboard like Zerodha Kite." },
          { icon: Users, title: "Leaderboards", desc: "Compete with other traders. Climb ranks based on virtual portfolio performance." },
          { icon: Zap, title: "Trading Journal", desc: "AI-reviewed journal entries to improve your decision-making discipline." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-6">
            <Icon className="mb-3 h-8 w-8 text-[#387ed1]" />
            <h3 className="mb-2 font-semibold text-white">{title}</h3>
            <p className="text-sm text-zinc-400">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-[#2a2d35] py-6 text-center text-xs text-zinc-500">
        TradeMind AI — Educational simulation only. Not financial advice. Not a registered broker.
      </footer>
    </div>
  );
}
