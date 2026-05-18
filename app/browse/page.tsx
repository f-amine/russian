"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Volume2 } from "lucide-react";
import { PageCard } from "@/components/page-card";
import { AudioPlayer } from "@/components/audio-player";
import { loadSentences } from "@/lib/sentences";
import { getProgress } from "@/lib/progress";
import type { Sentence, SentenceProgress } from "@/lib/types";
import { ISLAND_LABELS, ISLANDS } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 30;

export default function BrowsePage() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [progress, setProgress] = useState<Record<number, SentenceProgress>>({});
  const [search, setSearch] = useState("");
  const [island, setIsland] = useState("all");
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadSentences().then(setSentences);
    setProgress(getProgress());
  }, []);

  const filtered = useMemo(
    () =>
      sentences.filter((s) => {
        if (island !== "all" && s.island !== island) return false;
        if (statusFilter !== "all") {
          const p = progress[s.id];
          const status = p?.status || "new";
          if (statusFilter !== status) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          return (
            s.russian.toLowerCase().includes(q) ||
            s.english.toLowerCase().includes(q) ||
            s.transliteration.toLowerCase().includes(q) ||
            (s.notes?.toLowerCase().includes(q) ?? false)
          );
        }
        return true;
      }),
    [sentences, search, island, statusFilter, progress]
  );

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const statusOf = (id: number) => progress[id]?.status ?? "new";

  return (
    <div className="flex h-full w-full">
      <PageCard
        backHref="/"
        title="Browse Sentences"
        subtitle={`${filtered.length} of ${sentences.length}`}
      >
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Russian, English, transliteration…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
            />
          </div>
          <select
            value={island}
            onChange={(e) => {
              setIsland(e.target.value);
              setPage(0);
            }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-blue-300 focus:outline-none"
          >
            <option value="all">All Islands</option>
            {ISLANDS.map((i) => (
              <option key={i} value={i}>
                {ISLAND_LABELS[i] || i}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-blue-300 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="learning">Learning</option>
            <option value="reviewing">Reviewing</option>
            <option value="mastered">Mastered</option>
          </select>
        </div>

        {/* List */}
        <div className="space-y-2 pb-4">
          {paged.map((s) => (
            <div
              key={s.id}
              className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300"
            >
              <span className="mt-0.5 w-10 shrink-0 text-xs font-semibold text-slate-400 tabular-nums">
                #{s.id}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-slate-800">
                    {s.russian}
                  </span>
                  <AudioPlayer id={s.id} />
                </div>
                <div className="text-xs text-slate-500">
                  {s.transliteration}
                </div>
                <div className="mt-1 text-sm text-slate-700">{s.english}</div>
                {s.notes && (
                  <div className="text-xs italic text-slate-400">{s.notes}</div>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge status={statusOf(s.id)} />
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {ISLAND_LABELS[s.island] || s.island}
                </span>
              </div>
            </div>
          ))}
          {paged.length === 0 && (
            <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 py-12 text-sm text-slate-400">
              <Volume2 className="mb-2 h-5 w-5" />
              No sentences match your filters.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between border-t border-slate-100 bg-white/80 px-6 py-3 backdrop-blur">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </PageCard>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-slate-100 text-slate-600",
    learning: "bg-amber-100 text-amber-700",
    reviewing: "bg-blue-100 text-blue-700",
    mastered: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        map[status] || map.new
      )}
    >
      {status}
    </span>
  );
}
