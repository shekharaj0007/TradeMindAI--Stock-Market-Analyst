"use client";

import { TrendingUp, TrendingDown, Minus, Target, ShieldAlert, Crosshair } from "lucide-react";
import Link from "next/link";
import { TradingSignal, formatCurrency } from "@/lib/api";

interface AISignalPanelProps {
  signal: TradingSignal | null;
  loading?: boolean;
  onTrade?: (side: "BUY" | "SELL") => void;
}

export function AISignalPanel({ signal, loading, onTrade }: AISignalPanelProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-6">
        <div className="flex items-center gap-2 text-zinc-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#387ed1] border-t-transparent" />
          Analyzing chart patterns...
        </div>
      </div>
    );
  }

  if (!signal) return null;

  const actionStyle =
    signal.action === "BUY"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
      : signal.action === "SELL"
        ? "border-red-500/40 bg-red-500/10 text-red-400"
        : "border-amber-500/40 bg-amber-500/10 text-amber-400";

  const Icon = signal.action === "BUY" ? TrendingUp : signal.action === "SELL" ? TrendingDown : Minus;

  return (
    <div className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">AI Buy / Sell Signal</h2>
        <span className="text-xs text-zinc-500">Updates live</span>
      </div>

      <div className={`mb-4 flex items-center gap-4 rounded-xl border p-4 ${actionStyle}`}>
        <Icon className="h-10 w-10 shrink-0" />
        <div>
          <p className="text-2xl font-bold">{signal.action}</p>
          <p className="text-sm opacity-80">{signal.confidence}% confidence</p>
        </div>
        {signal.action !== "HOLD" && onTrade && (
          <button
            onClick={() => onTrade(signal.action as "BUY" | "SELL")}
            className={`ml-auto rounded-lg px-5 py-2.5 text-sm font-bold text-white ${
              signal.action === "BUY" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            Press {signal.action}
          </button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#0f1117] p-3">
          <p className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Crosshair className="h-3 w-3" /> Entry
          </p>
          <p className="font-semibold text-[#387ed1]">{formatCurrency(signal.entry_price)}</p>
        </div>
        <div className="rounded-lg bg-[#0f1117] p-3">
          <p className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Target className="h-3 w-3" /> Target
          </p>
          <p className="font-semibold text-emerald-400">{formatCurrency(signal.target_price)}</p>
        </div>
        <div className="rounded-lg bg-[#0f1117] p-3">
          <p className="flex items-center gap-1 text-[10px] text-zinc-500">
            <ShieldAlert className="h-3 w-3" /> Stop Loss
          </p>
          <p className="font-semibold text-red-400">{formatCurrency(signal.stop_loss)}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {signal.indicators.rsi != null && (
          <span className="rounded bg-[#0f1117] px-2 py-1 text-xs text-zinc-400">
            RSI {signal.indicators.rsi}
          </span>
        )}
        {signal.indicators.sma20 != null && (
          <span className="rounded bg-[#0f1117] px-2 py-1 text-xs text-zinc-400">
            SMA20 {formatCurrency(signal.indicators.sma20)}
          </span>
        )}
        <span className="rounded bg-[#0f1117] px-2 py-1 text-xs text-zinc-400">
          Trend {signal.indicators.trend}
        </span>
      </div>

      <p className="mb-3 text-sm text-zinc-300">{signal.reasoning}</p>

      {signal.ai_advice && (
        <div className="mb-3 rounded-lg border border-[#387ed1]/20 bg-[#387ed1]/5 p-3">
          <p className="mb-1 text-xs font-semibold text-[#387ed1]">AI Trading Coach</p>
          <p className="text-sm leading-relaxed text-zinc-300">{signal.ai_advice}</p>
        </div>
      )}

      <p className="text-[10px] text-zinc-600">{signal.disclaimer}</p>
    </div>
  );
}

export function InvestmentPicksPanel({ picks }: { picks: import("@/lib/api").InvestmentPick[] }) {
  if (!picks.length) return null;

  return (
    <div className="rounded-xl border border-[#2a2d35] bg-[#181a20]">
      <div className="border-b border-[#2a2d35] px-4 py-3">
        <h2 className="font-semibold text-white">Where to Invest — AI Picks</h2>
        <p className="text-xs text-zinc-500">Top BUY signals based on live technical analysis</p>
      </div>
      <div className="divide-y divide-[#2a2d35]">
        {picks.map((p) => (
          <Link
            key={p.symbol}
            href={`/stock/${p.symbol}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-[#1e2028]"
          >
            <div>
              <p className="font-medium text-white">{p.symbol}</p>
              <p className="text-xs text-zinc-500">{p.name}</p>
            </div>
            <div className="text-right">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
                BUY {p.confidence}%
              </span>
              <p className="mt-1 text-xs text-zinc-400">
                Entry {formatCurrency(p.entry_price)} → Target {formatCurrency(p.target_price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
