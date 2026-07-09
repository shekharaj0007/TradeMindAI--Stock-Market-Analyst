"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(loginId, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#387ed1]">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-zinc-400">Sign in to TradeMind AI</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-6">
          <label className="mb-1 block text-xs text-zinc-400">Email or username</label>
          <input
            type="text"
            required
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="mb-4 w-full rounded-lg border border-[#2a2d35] bg-[#0f1117] px-3 py-2.5 text-white outline-none focus:border-[#387ed1]"
          />

          <label className="mb-1 block text-xs text-zinc-400">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-lg border border-[#2a2d35] bg-[#0f1117] px-3 py-2.5 text-white outline-none focus:border-[#387ed1]"
          />

          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#387ed1] py-2.5 font-semibold text-white hover:bg-[#2d6bb5] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-400">
          No account?{" "}
          <Link href="/signup" className="text-[#387ed1] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
