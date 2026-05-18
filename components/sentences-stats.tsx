"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Infinity as InfinityIcon,
  TrendingUp,
  Zap,
  Headphones,
  MessageCircle,
  Filter,
  CloudUpload,
  Settings2,
  ArrowRight,
} from "lucide-react";

type Range = "today" | "all";

export function SentencesStats({
  todayPracticed,
  todayReps,
  todayMastered,
  allPracticed,
  allReps,
  allMastered,
}: {
  todayPracticed: number;
  todayReps: number;
  todayMastered: number;
  allPracticed: number;
  allReps: number;
  allMastered: number;
}) {
  const [range, setRange] = useState<Range>("today");

  const stats = range === "today"
    ? { practiced: todayPracticed, reps: todayReps, mastered: todayMastered }
    : { practiced: allPracticed, reps: allReps, mastered: allMastered };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      {/* Range toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
        <button
          onClick={() => setRange("today")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition",
            range === "today"
              ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Calendar className="h-4 w-4" />
          Today
        </button>
        <button
          onClick={() => setRange("all")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition",
            range === "all"
              ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <InfinityIcon className="h-4 w-4" />
          All-time
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 rounded-2xl border border-slate-200 bg-white px-2 py-5 shadow-sm">
        <StatTile value={stats.practiced} label="PRACTICED" />
        <StatTile value={stats.reps} label="REPS" />
        <StatTile value={stats.mastered} label="MASTERED" />
      </div>

      {/* Track progress */}
      <button className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
            <TrendingUp className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-slate-700">
            Track your progress
          </span>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
      </button>

      {/* TLDR card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-400 to-violet-500" />
        <div className="mb-3 flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-100 text-violet-600">
            <Zap className="h-4 w-4 fill-violet-600" />
          </span>
          <div>
            <div className="text-[10px] font-bold tracking-[0.18em] text-violet-500">
              TLDR
            </div>
            <div className="text-[15px] font-bold text-slate-800">
              Max Results, Minimum Time
            </div>
          </div>
        </div>
        <ul className="space-y-2.5 text-[13px] leading-snug text-slate-600">
          <Tip icon={<Headphones className="h-3.5 w-3.5 text-blue-500" />}>
            <b className="text-slate-800">Shadow:</b> listen, pause, repeat until fluent. Rate with stars.
          </Tip>
          <Tip icon={<MessageCircle className="h-3.5 w-3.5 text-emerald-500" />}>
            <b className="text-slate-800">Recall:</b> translate aloud from English. Rate with stars.
          </Tip>
          <Tip icon={<Filter className="h-3.5 w-3.5 text-amber-500" />}>
            <b className="text-slate-800">Focus:</b> use islands and collections to group sentences.
          </Tip>
          <Tip icon={<CloudUpload className="h-3.5 w-3.5 text-sky-500" />}>
            <b className="text-slate-800">Personalize:</b> import your own content for custom practice.
          </Tip>
          <Tip icon={<Settings2 className="h-3.5 w-3.5 text-slate-500" />}>
            <b className="text-slate-800">Customize:</b> adjust audio speed, repetitions, and pauses in settings.
          </Tip>
        </ul>
      </div>

      {/* Technique card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
            <Headphones className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[10px] font-bold tracking-[0.18em] text-slate-500">
              TECHNIQUE
            </div>
            <div className="text-[15px] font-bold text-slate-800">
              Shadowing &amp; Repetition
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-slate-600">
              Match native cadence and intonation by speaking along with each clip half a beat behind the speaker.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-bold tracking-[0.16em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function Tip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-1 shrink-0">{icon}</span>
      <span>{children}</span>
    </li>
  );
}
