"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", password: "", fullName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(form.email, form.username, form.password, form.fullName || undefined);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
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
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-sm text-zinc-400">Get ₹10,00,000 virtual balance to start</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-6">
          {(["fullName", "username", "email", "password"] as const).map((field) => (
            <div key={field} className="mb-4">
              <label className="mb-1 block text-xs capitalize text-zinc-400">
                {field === "fullName" ? "Full Name (optional)" : field}
              </label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                required={field !== "fullName"}
                minLength={field === "password" ? 6 : field === "username" ? 3 : undefined}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full rounded-lg border border-[#2a2d35] bg-[#0f1117] px-3 py-2.5 text-white outline-none focus:border-[#387ed1]"
              />
            </div>
          ))}

          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#387ed1] py-2.5 font-semibold text-white hover:bg-[#2d6bb5] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-[#387ed1] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
