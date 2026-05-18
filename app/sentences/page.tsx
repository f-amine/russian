"use client";

import { useEffect, useMemo, useState } from "react";
import { Settings, ListTodo, Headphones, MessageCircle, Info } from "lucide-react";
import { SentencesStats } from "@/components/sentences-stats";
import { ListenRepeat } from "@/components/listen-repeat";
import { ActiveRecall } from "@/components/active-recall";
import { PageCard } from "@/components/page-card";
import { loadSentences } from "@/lib/sentences";
import { getProgress, getTodayLog, getStats } from "@/lib/progress";
import { ISLAND_LABELS, ISLANDS, type Sentence } from "@/lib/types";
import { cn } from "@/lib/utils";

const RATING_KEY = "ru-sentence-stars";

type Mode = "listen" | "recall";

export default function SentencesPage() {
  const [all, setAll] = useState<Sentence[]>([]);
  const [mode, setMode] = useState<Mode>("listen");
  const [island, setIsland] = useState<string>("greetings_basics");
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [stats, setStats] = useState({ practiced: 0, mastered: 0 });
  const [today, setToday] = useState({ practiced: 0, reps: 0, mastered: 0 });

  useEffect(() => {
    loadSentences().then(setAll);
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(RATING_KEY);
      if (raw) {
        try {
          setRatings(JSON.parse(raw));
        } catch {}
      }
    }
    const s = getStats();
    setStats({ practiced: s.totalStudied, mastered: s.mastered });
    const t = getTodayLog();
    setToday({
      practiced: t.sentencesStudied,
      reps: t.recallCorrect + t.recallIncorrect,
      mastered: Object.values(getProgress()).filter(
        (p) =>
          p.status === "mastered" &&
          p.lastReviewed &&
          p.lastReviewed.startsWith(new Date().toISOString().split("T")[0])
      ).length,
    });
  }, []);

  const sentences = useMemo(
    () => (island === "all" ? all : all.filter((s) => s.island === island)),
    [all, island]
  );

  const totalCount = sentences.length;
  const masteredInIsland = sentences.filter((s) => (ratings[s.id] ?? 0) >= 4).length;
  const masteredPct = totalCount > 0 ? Math.round((masteredInIsland / totalCount) * 100) : 0;

  const updateRating = (id: number, stars: number) => {
    setRatings((prev) => {
      const next = { ...prev, [id]: stars };
      localStorage.setItem(RATING_KEY, JSON.stringify(next));
      return next;
    });
  };

  const allReps = Object.values(ratings).filter((v) => v > 0).length;

  const rightRail = (
    <SentencesStats
      todayPracticed={today.practiced}
      todayReps={today.reps}
      todayMastered={today.mastered}
      allPracticed={stats.practiced}
      allReps={allReps}
      allMastered={stats.mastered}
    />
  );

  return (
    <div className="flex h-full w-full gap-5">
      <PageCard
        backHref="/"
        title={
          <span className="inline-flex items-center">
            <span className="mr-1.5 inline-flex items-center rounded-md bg-gradient-to-br from-red-500 via-blue-500 to-white px-1.5 py-0.5 text-[11px] font-bold text-slate-900 ring-1 ring-white/40">
              RU
            </span>
            Sentences
          </span>
        }
        subtitle={`${ISLAND_LABELS[island] || "All islands"} · Part 1`}
        actions={
          <>
            <select
              value={island}
              onChange={(e) => setIsland(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 shadow-sm transition focus:border-blue-300 focus:outline-none"
            >
              <option value="all">All</option>
              {ISLANDS.map((i) => (
                <option key={i} value={i}>
                  {ISLAND_LABELS[i] || i}
                </option>
              ))}
            </select>
            <button
              className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500 text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-600"
              aria-label="Filters"
            >
              <ListTodo className="h-4 w-4" />
            </button>
            <button
              className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:text-slate-700"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </>
        }
        contentClassName="overflow-hidden flex flex-col"
      >
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {masteredInIsland} of {totalCount} mastered
            </span>
            <span className="font-semibold text-slate-700">{masteredPct}%</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
              style={{ width: `${masteredPct}%` }}
            />
          </div>
        </div>

        {/* Mode tabs */}
        <div className="mb-4 grid grid-cols-[1fr_2fr] gap-2 rounded-2xl bg-slate-100/70 p-1.5">
          <ModeTab
            active={mode === "listen"}
            onClick={() => setMode("listen")}
            tone="blue"
            icon={<Headphones className="h-4 w-4" />}
            label="Listen & Repeat"
          />
          <ModeTab
            active={mode === "recall"}
            onClick={() => setMode("recall")}
            tone="emerald"
            icon={<MessageCircle className="h-4 w-4" />}
            label="Active Recall"
            info
          />
        </div>

        {/* Body */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {totalCount === 0 ? (
            <div className="grid h-full place-items-center text-sm text-slate-400">
              Loading sentences…
            </div>
          ) : mode === "listen" ? (
            <ListenRepeat
              sentences={sentences}
              ratings={ratings}
              onRate={updateRating}
            />
          ) : (
            <ActiveRecall
              sentences={sentences}
              ratings={ratings}
              onRate={updateRating}
            />
          )}
        </div>
      </PageCard>

      <aside className="hidden w-[340px] shrink-0 overflow-y-auto pr-1 xl:block">
        {rightRail}
      </aside>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  tone,
  icon,
  label,
  info,
}: {
  active: boolean;
  onClick: () => void;
  tone: "blue" | "emerald";
  icon: React.ReactNode;
  label: string;
  info?: boolean;
}) {
  const activeClass =
    tone === "blue"
      ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
      : "bg-emerald-500 text-white shadow-md shadow-emerald-500/30";
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition",
        active ? activeClass : "text-slate-500 hover:text-slate-700"
      )}
    >
      {icon}
      <span>{label}</span>
      {info && active && <Info className="h-3.5 w-3.5 opacity-70" />}
    </button>
  );
}
