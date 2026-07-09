"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Star,
  History,
  Brain,
  Trophy,
  BookOpen,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/orders", label: "Orders", icon: History },
  { href: "/ai-advisor", label: "AI Advisor", icon: Brain },
  { href: "/journal", label: "Trading Journal", icon: BookOpen },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-[#2a2d35] bg-[#13151b]">
      <div className="flex items-center gap-2 border-b border-[#2a2d35] px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#387ed1]">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">TradeMind AI</p>
          <p className="text-[10px] text-zinc-500">Paper Trading</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-[#387ed1]/15 text-[#387ed1]"
                : "text-zinc-400 hover:bg-[#1e2028] hover:text-zinc-200"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-[#2a2d35] p-3">
        <div className="mb-2 rounded-lg bg-[#1a1d26] px-3 py-2">
          <p className="truncate text-xs font-medium text-zinc-300">{user?.username}</p>
          <p className="text-[10px] text-zinc-500">{user?.is_premium ? "Premium" : "Free Plan"}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-[#1e2028] hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
