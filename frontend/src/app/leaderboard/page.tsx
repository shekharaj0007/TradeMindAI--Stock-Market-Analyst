"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api, formatCurrency, formatPercent, LeaderboardEntry } from "@/lib/api";
import { pnlColor } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api.leaderboard().then(setEntries);
  }, []);

  const medal = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-zinc-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm text-zinc-500">{rank}</span>;
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Trophy className="h-7 w-7 text-yellow-400" /> Leaderboard
        </h1>
        <p className="text-sm text-zinc-400">Top paper traders by portfolio value</p>
      </div>

      <div className="rounded-xl border border-[#2a2d35] bg-[#181a20]">
        <div className="divide-y divide-[#2a2d35]">
          {entries.map((e) => (
            <div
              key={e.rank}
              className={`flex items-center justify-between px-6 py-4 ${
                e.username === user?.username ? "bg-[#387ed1]/10" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                {medal(e.rank)}
                <span className={`font-medium ${e.username === user?.username ? "text-[#387ed1]" : "text-white"}`}>
                  {e.username}
                  {e.username === user?.username && " (You)"}
                </span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">{formatCurrency(e.total_value)}</p>
                <p className={`text-xs ${pnlColor(e.pnl_percent)}`}>{formatPercent(e.pnl_percent)}</p>
              </div>
            </div>
          ))}
          {!entries.length && (
            <p className="px-6 py-8 text-center text-zinc-500">No traders yet. Be the first!</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
