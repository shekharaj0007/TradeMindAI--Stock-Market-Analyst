"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api, formatCurrency, StockQuote } from "@/lib/api";

interface OrderModalProps {
  stock: StockQuote;
  onClose: () => void;
  onSuccess: () => void;
  defaultSide?: "BUY" | "SELL";
}

export function OrderModal({ stock, onClose, onSuccess, defaultSide = "BUY" }: OrderModalProps) {
  const [side, setSide] = useState<"BUY" | "SELL">(defaultSide);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = stock.price * quantity;

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      await api.placeOrder({ symbol: stock.symbol, side, quantity });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#2a2d35] bg-[#181a20] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{stock.symbol}</h3>
            <p className="text-sm text-zinc-400">{stock.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-2xl font-bold text-white">{formatCurrency(stock.price)}</p>

        <div className="mb-4 flex gap-2">
          {(["BUY", "SELL"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                side === s
                  ? s === "BUY"
                    ? "bg-emerald-500 text-white"
                    : "bg-red-500 text-white"
                  : "bg-[#1e2028] text-zinc-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs text-zinc-400">Quantity</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="mb-4 w-full rounded-lg border border-[#2a2d35] bg-[#0f1117] px-3 py-2.5 text-white outline-none focus:border-[#387ed1]"
        />

        <div className="mb-4 flex justify-between rounded-lg bg-[#0f1117] px-4 py-3">
          <span className="text-sm text-zinc-400">Total</span>
          <span className="font-semibold text-white">{formatCurrency(total)}</span>
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className={`w-full rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50 ${
            side === "BUY" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {loading ? "Placing order..." : `${side} ${quantity} share${quantity > 1 ? "s" : ""}`}
        </button>

        <p className="mt-3 text-center text-[10px] text-zinc-500">
          Simulated order — no real money involved
        </p>
      </div>
    </div>
  );
}
