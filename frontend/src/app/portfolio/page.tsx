"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api, formatCurrency, formatPercent, PortfolioSummary } from "@/lib/api";
import { pnlColor } from "@/lib/utils";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);

  useEffect(() => {
    api.portfolio().then(setPortfolio);
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <p className="text-sm text-zinc-400">Your virtual holdings & P&L</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-4">
          <p className="text-xs text-zinc-500">Invested Value</p>
          <p className="text-xl font-bold text-white">{formatCurrency(portfolio?.invested_value ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-4">
          <p className="text-xs text-zinc-500">Current Value</p>
          <p className="text-xl font-bold text-white">{formatCurrency(portfolio?.current_value ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-4">
          <p className="text-xs text-zinc-500">Total P&L</p>
          <p className={`text-xl font-bold ${pnlColor(portfolio?.total_pnl ?? 0)}`}>
            {formatCurrency(portfolio?.total_pnl ?? 0)} ({formatPercent(portfolio?.total_pnl_percent ?? 0)})
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#2a2d35] bg-[#181a20]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d35] text-left text-xs text-zinc-500">
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Avg Price</th>
                <th className="px-4 py-3">LTP</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">P&L</th>
              </tr>
            </thead>
            <tbody>
              {!portfolio?.holdings.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No holdings. <Link href="/dashboard" className="text-[#387ed1]">Start trading</Link>
                  </td>
                </tr>
              ) : (
                portfolio.holdings.map((h) => (
                  <tr key={h.symbol} className="border-b border-[#2a2d35]/50 hover:bg-[#1e2028]">
                    <td className="px-4 py-3">
                      <Link href={`/stock/${h.symbol}`} className="font-medium text-[#387ed1]">
                        {h.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{h.quantity}</td>
                    <td className="px-4 py-3 text-zinc-300">{formatCurrency(h.avg_price)}</td>
                    <td className="px-4 py-3 text-zinc-300">{formatCurrency(h.current_price)}</td>
                    <td className="px-4 py-3 text-white">{formatCurrency(h.market_value)}</td>
                    <td className={`px-4 py-3 ${pnlColor(h.pnl)}`}>
                      {formatCurrency(h.pnl)} ({formatPercent(h.pnl_percent)})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
