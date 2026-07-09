"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api, JournalEntry } from "@/lib/api";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => api.journal().then(setEntries);

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createJournal({ title, content });
      setTitle("");
      setContent("");
      load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <BookOpen className="h-7 w-7 text-[#387ed1]" /> Trading Journal
        </h1>
        <p className="text-sm text-zinc-400">Document trades — AI gives feedback on your decisions</p>
      </div>

      <form onSubmit={submit} className="mb-6 rounded-xl border border-[#2a2d35] bg-[#181a20] p-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title (e.g. Bought RELIANCE on dip)"
          required
          className="mb-3 w-full rounded-lg border border-[#2a2d35] bg-[#0f1117] px-3 py-2.5 text-white outline-none focus:border-[#387ed1]"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What was your thesis? What emotions did you feel? What would you do differently?"
          required
          rows={4}
          className="mb-3 w-full rounded-lg border border-[#2a2d35] bg-[#0f1117] px-3 py-2.5 text-white outline-none focus:border-[#387ed1]"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-[#387ed1] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save & Get AI Feedback
        </button>
      </form>

      <div className="space-y-4">
        {entries.map((e) => (
          <div key={e.id} className="rounded-xl border border-[#2a2d35] bg-[#181a20] p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-white">{e.title}</h3>
              <span className="text-xs text-zinc-500">
                {new Date(e.created_at).toLocaleDateString("en-IN")}
              </span>
            </div>
            <p className="mb-4 text-sm text-zinc-300">{e.content}</p>
            {e.ai_feedback && (
              <div className="rounded-lg border border-[#387ed1]/20 bg-[#387ed1]/5 p-4">
                <p className="mb-1 text-xs font-semibold text-[#387ed1]">AI Coach Feedback</p>
                <p className="text-sm leading-relaxed text-zinc-300">{e.ai_feedback}</p>
              </div>
            )}
          </div>
        ))}
        {!entries.length && (
          <p className="text-center text-sm text-zinc-500">No journal entries yet. Write your first one above.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
