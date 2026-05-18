"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Headphones,
  Layers,
  MessageCircle,
  BookOpen,
  Flame,
  Trophy,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PageCard } from "@/components/page-card";
import { getStats, getTodayLog } from "@/lib/progress";
import { loadSentences } from "@/lib/sentences";
import type { DailyLog } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState({
    mastered: 0,
    reviewing: 0,
    learning: 0,
    totalStudied: 0,
    streak: 0,
    totalLogs: 0,
    logs: [] as DailyLog[],
  });
  const [today, setToday] = useState<DailyLog | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setStats(getStats());
    setToday(getTodayLog());
    loadSentences().then((s) => setTotal(s.length));
  }, []);

  const overallPercent =
    total > 0 ? Math.round((stats.totalStudied / total) * 100) : 0;
  const masteredPercent =
    total > 0 ? Math.round((stats.mastered / total) * 100) : 0;

  return (
    <div className="flex h-full w-full gap-5">
      <PageCard
        title={
          <span className="inline-flex items-center">
            <span className="mr-1.5 inline-flex items-center rounded-md bg-gradient-to-br from-red-500 via-blue-500 to-white px-1.5 py-0.5 text-[11px] font-bold text-slate-900 ring-1 ring-white/40">
              RU
            </span>
            Dashboard
          </span>
        }
        subtitle="Sentence-First · daily focus"
      >
        <div className="space-y-5">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 p-6 text-white shadow-md">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  Daily Goal
                </div>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  Keep your streak alive
                </h2>
                <p className="mt-1 text-sm text-white/80">
                  {stats.streak > 0
                    ? `${stats.streak} day${stats.streak === 1 ? "" : "s"} in a row · ${overallPercent}% of vault touched`
                    : "Start today. Sentences first, grammar second."}
                </p>
              </div>
              <Link
                href="/sentences"
                className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
              >
                Start session
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid gap-3 md:grid-cols-4">
            <StatTile
              icon={<BookOpen className="h-4 w-4" />}
              tone="blue"
              value={stats.totalStudied}
              label="STUDIED"
              hint={`${overallPercent}% of ${total}`}
            />
            <StatTile
              icon={<Trophy className="h-4 w-4" />}
              tone="emerald"
              value={stats.mastered}
              label="MASTERED"
              hint={`${masteredPercent}% mastered`}
            />
            <StatTile
              icon={<Sparkles className="h-4 w-4" />}
              tone="amber"
              value={stats.learning + stats.reviewing}
              label="IN PROGRESS"
              hint={`${stats.learning} learning · ${stats.reviewing} reviewing`}
            />
            <StatTile
              icon={<Flame className="h-4 w-4" />}
              tone="violet"
              value={stats.streak}
              label="STREAK"
              hint={stats.streak > 0 ? "Keep going" : "Start today"}
            />
          </div>

          {/* Today */}
          {today && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[15px] font-semibold text-slate-800">
                  Today
                </div>
                <span className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                  {today.date}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Mini value={today.sentencesStudied} label="Sentences" />
                <Mini value={today.newSentencesLearned} label="New learned" />
                <Mini
                  value={`${
                    today.recallCorrect + today.recallIncorrect > 0
                      ? Math.round(
                          (today.recallCorrect /
                            (today.recallCorrect + today.recallIncorrect)) *
                            100
                        )
                      : 0
                  }%`}
                  label="Recall accuracy"
                />
                <Mini value={`${today.listeningMinutes}m`} label="Listening" />
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid gap-3 md:grid-cols-3">
            <QuickAction
              href="/sentences"
              tone="blue"
              icon={<Headphones className="h-5 w-5" />}
              title="Listen & Repeat"
              desc="Shadow audio, rate fluency"
            />
            <QuickAction
              href="/sentences"
              tone="emerald"
              icon={<MessageCircle className="h-5 w-5" />}
              title="Active Recall"
              desc="Translate aloud, get graded"
            />
            <QuickAction
              href="/browse"
              tone="amber"
              icon={<Layers className="h-5 w-5" />}
              title="Browse Islands"
              desc="22 topics by life context"
            />
          </div>

          {/* Method */}
          <div className="grid gap-3 md:grid-cols-3">
            <MethodStep
              num="1"
              tone="blue"
              title="Language Islands"
              desc="Full sentences from your real life, grouped by topic."
            />
            <MethodStep
              num="2"
              tone="emerald"
              title="Audio Flood + Shadowing"
              desc="Listen on repeat. Speak along out loud."
            />
            <MethodStep
              num="3"
              tone="violet"
              title="Active Recall"
              desc="English → Russian aloud, from memory. The hard part."
            />
          </div>
        </div>
      </PageCard>
    </div>
  );
}

function StatTile({
  icon,
  tone,
  value,
  label,
  hint,
}: {
  icon: React.ReactNode;
  tone: "blue" | "emerald" | "amber" | "violet";
  value: number;
  label: string;
  hint: string;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  } as const;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", tones[tone])}>
          {icon}
        </span>
        <span className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

function Mini({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="text-lg font-bold tracking-tight text-slate-900 tabular-nums">
        {value}
      </div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function QuickAction({
  href,
  tone,
  icon,
  title,
  desc,
}: {
  href: string;
  tone: "blue" | "emerald" | "amber";
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  const tones = {
    blue: "from-blue-50 to-blue-100/40 text-blue-600",
    emerald: "from-emerald-50 to-emerald-100/40 text-emerald-600",
    amber: "from-amber-50 to-amber-100/40 text-amber-600",
  } as const;
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br p-4 shadow-sm transition hover:shadow-md",
        tones[tone]
      )}
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-sm">
        {icon}
      </span>
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function MethodStep({
  num,
  tone,
  title,
  desc,
}: {
  num: string;
  tone: "blue" | "emerald" | "violet";
  title: string;
  desc: string;
}) {
  const tones = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
  } as const;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-lg text-xs font-bold text-white",
            tones[tone]
          )}
        >
          {num}
        </span>
        <span className="text-sm font-semibold text-slate-800">{title}</span>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}
