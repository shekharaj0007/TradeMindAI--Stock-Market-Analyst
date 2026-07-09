"use client";

import { useEffect, useState } from "react";
import { Brain, Loader2, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { InvestmentPicksPanel } from "@/components/AISignalPanel";
import { api, AIAnalysis, InvestmentPick, PortfolioSummary } from "@/lib/api";

const PRESET = ["RELIANCE", "TATAMOTORS", "HDFCBANK", "INFY", "TCS"];

export default function AIAdvisorPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [research, setResearch] = useState<{ symbol: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [picks, setPicks] = useState<InvestmentPick[]>([]);

  useEffect(() => {
    api.portfolio().then((p) => {
      setPortfolio(p);
      if (p.holdings.length) {
        setSymbols(p.holdings.map((h) => h.symbol));
      } else {
        setSymbols(["RELIANCE", "TATAMOTORS", "HDFCBANK"]);
      }
    });
    api.picks().then(setPicks);
  }, []);

  const toggle = (sym: string) => {
    setSymbols((prev) => (prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]));
  };

  const analyze = async () => {
    setLoading(true);
    try {
      const result = await api.aiAnalyze(symbols);
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  const doResearch = async (symbol: string) => {
    setResearchLoading(true);
    try {
      const result = await api.aiResearch(symbol);
      setResearch({ symbol, text: result.research });
    } finally {
      setResearchLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Brain className="h-7 w-7 text-[#387ed1]" /> AI Portfolio Advisor
        </h1>
        <p className="text-sm text-zinc-400">Get AI-powered risk analysis & diversification suggestions</p>
      </div>

      <div className="mb-6">
        <InvestmentPicksPanel picks={picks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-6">
          <h2 className="mb-4 font-semibold text-white">Select Holdings to Analyze</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {PRESET.map((sym) => (
              <button
                key={sym}
                onClick={() => toggle(sym)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  symbols.includes(sym)
                    ? "bg-[#387ed1] text-white"
                    : "border border-[#2a2d35] text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {portfolio?.holdings.length ? (
            <p className="mb-3 text-xs text-zinc-500">
              Your portfolio: {portfolio.holdings.map((h) => h.symbol).join(", ")}
            </p>
          ) : null}

          <div className="mb-4 flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value.toUpperCase())}
              placeholder="Add custom symbol"
              className="flex-1 rounded-lg border border-[#2a2d35] bg-[#0f1117] px-3 py-2 text-sm text-white outline-none focus:border-[#387ed1]"
            />
            <button
              onClick={() => custom && toggle(custom)}
              className="rounded-lg border border-[#2a2d35] px-4 py-2 text-sm text-zinc-300"
            >
              Add
            </button>
          </div>

          <p className="mb-4 text-sm text-zinc-400">
            Selected: {symbols.length ? symbols.join(", ") : "None"}
          </p>

          <button
            onClick={analyze}
            disabled={loading || !symbols.length}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#387ed1] py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Analyze Portfolio
          </button>
        </div>

        <div className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-6">
          <h2 className="mb-4 font-semibold text-white">Analysis Results</h2>
          {!analysis ? (
            <p className="text-sm text-zinc-500">
              Example: Upload Tata Motors, Reliance, HDFC Bank — AI will flag concentration risk
              and suggest IT or international ETF diversification.
            </p>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-[#0f1117] p-4">
                <AlertTriangle className={`h-8 w-8 ${analysis.risk_score > 60 ? "text-red-400" : "text-amber-400"}`} />
                <div>
                  <p className="text-xs text-zinc-500">Risk Score</p>
                  <p className="text-2xl font-bold text-white">{analysis.risk_score.toFixed(0)}/100</p>
                </div>
              </div>
              <div className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {analysis.analysis}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-white">Suggestions</h3>
              <ul className="space-y-1">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-zinc-400">• {s}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#2a2d35] bg-[#181a20] p-6">
        <h2 className="mb-4 font-semibold text-white">AI Stock Research</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {PRESET.map((sym) => (
            <button
              key={sym}
              onClick={() => doResearch(sym)}
              disabled={researchLoading}
              className="rounded-lg border border-[#2a2d35] px-3 py-1.5 text-sm text-zinc-300 hover:border-[#387ed1]"
            >
              Research {sym}
            </button>
          ))}
        </div>
        {research && (
          <div>
            <h3 className="mb-2 font-medium text-[#387ed1]">{research.symbol}</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{research.text}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        AI analysis is for educational purposes only. Not financial advice.
      </p>
    </DashboardLayout>
  );
}
