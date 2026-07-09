"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Newspaper, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OrderModal } from "@/components/OrderModal";
import { InvestmentPicksPanel } from "@/components/AISignalPanel";
import { api, formatCurrency, formatPercent, InvestmentPick, NewsItem, PortfolioSummary, StockQuote } from "@/lib/api";
import { DEMO_NEWS, DEMO_PICKS, DEMO_STOCKS } from "@/lib/demo-data";
import { pnlColor } from "@/lib/utils";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [stocks, setStocks] = useState<StockQuote[]>(DEMO_STOCKS);
  const [news, setNews] = useState<NewsItem[]>(DEMO_NEWS);
  const [picks, setPicks] = useState<InvestmentPick[]>(DEMO_PICKS);
  const [selected, setSelected] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    const [p, s, n, pk] = await Promise.all([
      safe(() => api.portfolio(), null),
      safe(() => api.stocks(), DEMO_STOCKS),
      safe(() => api.news(), DEMO_NEWS),
      safe(() => api.picks(), DEMO_PICKS),
    ]);

    if (p) setPortfolio(p);
    setStocks(s.length ? s : DEMO_STOCKS);
    setNews(n.length ? n : DEMO_NEWS);
    setPicks(pk.length ? pk : DEMO_PICKS);
    setOffline(!p && s === DEMO_STOCKS);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalValue = (portfolio?.virtual_balance ?? 1_000_000) + (portfolio?.current_value ?? 0);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-400">Paper trading overview</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-[#2a2d35] px-3 py-2 text-sm text-zinc-300 hover:border-[#387ed1]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {offline && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Showing demo data — start backend:{" "}
          <code className="text-amber-200">uvicorn app.main:app --port 9001</code>
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Value", value: formatCurrency(totalValue) },
          { label: "Available Cash", value: formatCurrency(portfolio?.virtual_balance ?? 1_000_000) },
          { label: "Invested", value: formatCurrency(portfolio?.invested_value ?? 0) },
          {
            label: "Total P&L",
            value: formatCurrency(portfolio?.total_pnl ?? 0),
            sub: formatPercent(portfolio?.total_pnl_percent ?? 0),
            pnl: portfolio?.total_pnl ?? 0,
          },
        ].map(({ label, value, sub, pnl }) => (
          <div key={label} className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`mt-1 text-xl font-bold ${pnl !== undefined ? pnlColor(pnl) : "text-white"}`}>
              {value}
            </p>
            {sub && <p className={`text-xs ${pnlColor(pnl ?? 0)}`}>{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[#2a2d35] bg-[#181a20]">
            <div className="border-b border-[#2a2d35] px-4 py-3">
              <h2 className="font-semibold text-white">Market Watch</h2>
            </div>
            <div className="divide-y divide-[#2a2d35]">
              {stocks.map((s) => (
                <div
                  key={s.symbol}
                  className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-[#1e2028]"
                  onClick={() => setSelected(s)}
                >
                  <div>
                    <Link href={`/stock/${s.symbol}`} className="font-medium text-white hover:text-[#387ed1]">
                      {s.symbol}
                    </Link>
                    <p className="text-xs text-zinc-500">{s.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{formatCurrency(s.price)}</p>
                    <p className={`flex items-center justify-end gap-0.5 text-xs ${pnlColor(s.change)}`}>
                      {s.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {formatPercent(s.change_percent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-4">
            <h2 className="mb-3 font-semibold text-white">Holdings</h2>
            {!portfolio?.holdings?.length ? (
              <p className="text-sm text-zinc-500">No holdings yet. Click a stock in Market Watch to buy.</p>
            ) : (
              portfolio.holdings.slice(0, 5).map((h) => (
                <div key={h.symbol} className="mb-2 flex justify-between text-sm">
                  <span className="text-zinc-300">{h.symbol}</span>
                  <span className={pnlColor(h.pnl)}>{formatPercent(h.pnl_percent)}</span>
                </div>
              ))
            )}
            <Link href="/portfolio" className="mt-2 block text-xs text-[#387ed1] hover:underline">
              View full portfolio →
            </Link>
          </div>

          <InvestmentPicksPanel picks={picks} />

          <div className="rounded-xl border border-[#2a2d35] bg-[#181a20]">
            <div className="flex items-center gap-2 border-b border-[#2a2d35] px-4 py-3">
              <Newspaper className="h-4 w-4 text-[#387ed1]" />
              <h2 className="font-semibold text-white">Market News</h2>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-[#2a2d35]">
              {news.slice(0, 5).map((n, i) => (
                <div key={i} className="block px-4 py-3">
                  <p className="text-sm text-zinc-200 line-clamp-2">{n.title}</p>
                  <p className="mt-1 text-[10px] text-zinc-500">{n.source}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selected && <OrderModal stock={selected} onClose={() => setSelected(null)} onSuccess={load} />}
    </DashboardLayout>
  );
}
