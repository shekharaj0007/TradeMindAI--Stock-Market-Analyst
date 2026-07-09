"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Star } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OrderModal } from "@/components/OrderModal";
import { LiveStockChart } from "@/components/LiveStockChart";
import { AISignalPanel } from "@/components/AISignalPanel";
import { api, Candle, formatCurrency, formatPercent, StockQuote, TradingSignal } from "@/lib/api";
import { pnlColor } from "@/lib/utils";

export default function StockPage() {
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase();
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [signalLoading, setSignalLoading] = useState(true);
  const [showOrder, setShowOrder] = useState(false);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!symbol) return;
    setSignalLoading(true);
    Promise.all([api.quote(symbol), api.candles(symbol, "6mo", "1d"), api.signal(symbol)])
      .then(([q, c, s]) => {
        setQuote(q);
        setCandles(c);
        setSignal(s);
      })
      .catch(() => setError("Stock not found"))
      .finally(() => setSignalLoading(false));
  }, [symbol]);

  const handleQuoteUpdate = useCallback((price: number, changePct: number) => {
    setQuote((prev) =>
      prev ? { ...prev, price, change_percent: changePct, change: (price * changePct) / 100 } : prev
    );
  }, []);

  const handleSignalUpdate = useCallback((partial: Partial<TradingSignal>) => {
    setSignal((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const openTrade = (side: "BUY" | "SELL") => {
    setOrderSide(side);
    setShowOrder(true);
  };

  const addWatchlist = async () => {
    if (symbol) await api.addWatchlist(symbol);
  };

  if (error) {
    return (
      <DashboardLayout>
        <p className="text-red-400">{error}</p>
      </DashboardLayout>
    );
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#387ed1] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{quote.symbol}</h1>
          <p className="text-sm text-zinc-400">{quote.name}</p>
          <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(quote.price)}</p>
          <p className={`text-sm ${pnlColor(quote.change)}`}>
            {formatCurrency(quote.change)} ({formatPercent(quote.change_percent)})
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addWatchlist}
            className="flex items-center gap-1 rounded-lg border border-[#2a2d35] px-4 py-2 text-sm text-zinc-300 hover:border-[#387ed1]"
          >
            <Star className="h-4 w-4" /> Watchlist
          </button>
          <button
            onClick={() => openTrade("BUY")}
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Buy
          </button>
          <button
            onClick={() => openTrade("SELL")}
            className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Sell
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { label: "Open", value: quote.open },
          { label: "High", value: quote.high },
          { label: "Low", value: quote.low },
          { label: "Volume", value: quote.volume },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-[#2a2d35] bg-[#181a20] p-3">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="font-medium text-white">
              {value !== undefined && value !== null
                ? label === "Volume"
                  ? value.toLocaleString("en-IN")
                  : formatCurrency(value)
                : "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-4">
            <h2 className="mb-3 font-semibold text-white">Live Candlestick Chart</h2>
            <LiveStockChart
              symbol={symbol}
              initialCandles={candles}
              signal={signal}
              onQuoteUpdate={handleQuoteUpdate}
              onSignalUpdate={handleSignalUpdate}
              height={420}
            />
            <p className="mt-2 text-[10px] text-zinc-600">
              Blue line = Entry · Green = Target · Red = Stop Loss. Chart refreshes every 10 seconds.
            </p>
          </div>
        </div>

        <div>
          <AISignalPanel signal={signal} loading={signalLoading} onTrade={openTrade} />
        </div>
      </div>

      {showOrder && (
        <OrderModal
          stock={quote}
          defaultSide={orderSide}
          onClose={() => setShowOrder(false)}
          onSuccess={() => {}}
        />
      )}
    </DashboardLayout>
  );
}
