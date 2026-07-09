"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OrderModal } from "@/components/OrderModal";
import { api, formatCurrency, formatPercent, StockQuote } from "@/lib/api";
import { pnlColor } from "@/lib/utils";

export default function WatchlistPage() {
  const [items, setItems] = useState<StockQuote[]>([]);
  const [symbol, setSymbol] = useState("");
  const [selected, setSelected] = useState<StockQuote | null>(null);

  const load = () => api.watchlist().then(setItems);

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!symbol.trim()) return;
    await api.addWatchlist(symbol.trim().toUpperCase());
    setSymbol("");
    load();
  };

  const remove = async (sym: string) => {
    await api.removeWatchlist(sym);
    load();
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-sm text-zinc-400">Track stocks you&apos;re interested in</p>
        </div>
        <div className="flex gap-2">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g. RELIANCE"
            className="rounded-lg border border-[#2a2d35] bg-[#181a20] px-3 py-2 text-sm text-white outline-none focus:border-[#387ed1]"
          />
          <button
            onClick={add}
            className="flex items-center gap-1 rounded-lg bg-[#387ed1] px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#2a2d35] bg-[#181a20]">
        {!items.length ? (
          <p className="px-4 py-8 text-center text-zinc-500">Watchlist is empty. Add symbols above.</p>
        ) : (
          <div className="divide-y divide-[#2a2d35]">
            {items.map((s) => (
              <div key={s.symbol} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link href={`/stock/${s.symbol}`} className="font-medium text-white hover:text-[#387ed1]">
                    {s.symbol}
                  </Link>
                  <p className="text-xs text-zinc-500">{s.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white">{formatCurrency(s.price)}</p>
                    <p className={`text-xs ${pnlColor(s.change)}`}>{formatPercent(s.change_percent)}</p>
                  </div>
                  <button
                    onClick={() => setSelected(s)}
                    className="rounded bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400"
                  >
                    Trade
                  </button>
                  <button onClick={() => remove(s.symbol)} className="text-zinc-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <OrderModal stock={selected} onClose={() => setSelected(null)} onSuccess={load} />}
    </DashboardLayout>
  );
}
