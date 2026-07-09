"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api, formatCurrency, Order } from "@/lib/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.orders().then(setOrders);
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Order History</h1>
        <p className="text-sm text-zinc-400">All simulated buy & sell orders</p>
      </div>

      <div className="rounded-xl border border-[#2a2d35] bg-[#181a20]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d35] text-left text-xs text-zinc-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Side</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {!orders.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No orders yet</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b border-[#2a2d35]/50 hover:bg-[#1e2028]">
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(o.created_at).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{o.symbol}</td>
                    <td className={`px-4 py-3 font-medium ${o.side === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                      {o.side}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{o.quantity}</td>
                    <td className="px-4 py-3 text-zinc-300">{formatCurrency(o.price)}</td>
                    <td className="px-4 py-3 text-white">{formatCurrency(o.price * o.quantity)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                        {o.status}
                      </span>
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
