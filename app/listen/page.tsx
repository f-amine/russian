"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Repeat,
  Shuffle,
  Gauge,
  Headphones,
} from "lucide-react";
import { PageCard } from "@/components/page-card";
import { PlaylistPlayer } from "@/components/audio-player";
import { loadSentences } from "@/lib/sentences";
import { updateTodayLog, getTodayLog } from "@/lib/progress";
import type { Sentence } from "@/lib/types";
import { ISLAND_LABELS, ISLANDS } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ListenPage() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [island, setIsland] = useState<string>("all");
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const [listeningStarted, setListeningStarted] = useState<number | null>(null);

  useEffect(() => {
    loadSentences().then(setSentences);
  }, []);

  const filtered =
    island === "all"
      ? sentences
      : sentences.filter((s) => s.island === island);
  const ids = filtered.map((s) => s.id);

  const onTrackChange = useCallback(
    (id: number) => {
      const item = sentences.find((s) => s.id === id);
      if (item) setCurrent(item);
      if (!listeningStarted) setListeningStarted(Date.now());
    },
    [sentences, listeningStarted]
  );

  useEffect(() => {
    if (!listeningStarted) return;
    const interval = setInterval(() => {
      const minutes = Math.floor((Date.now() - listeningStarted) / 60000);
      if (minutes > 0) {
        const todayLog = getTodayLog();
        updateTodayLog({
          listeningMinutes: Math.max(todayLog.listeningMinutes, minutes),
        });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [listeningStarted]);

  return (
    <div className="flex h-full w-full">
      <PageCard
        backHref="/"
        title="Shadow & Loop"
        subtitle="Audio flood · hands-free practice"
      >
        <div className="mx-auto grid max-w-3xl gap-4">
          {/* Player + current sentence */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Headphones className="h-4 w-4 text-blue-500" />
                Player
              </div>
              <div className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-slate-400" />
                {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-semibold transition",
                      speed === s
                        ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
                        : "text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {ids.length > 0 ? (
              <div className="space-y-3">
                <PlaylistPlayer
                  ids={ids}
                  speed={speed}
                  loop={loop}
                  shuffle={shuffle}
                  onTrackChange={onTrackChange}
                  onLoopComplete={(count) => setLoopCount(count)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <ToggleChip
                    active={loop}
                    onClick={() => setLoop(!loop)}
                    icon={<Repeat className="h-3.5 w-3.5" />}
                    label="Loop"
                  />
                  <ToggleChip
                    active={shuffle}
                    onClick={() => setShuffle(!shuffle)}
                    icon={<Shuffle className="h-3.5 w-3.5" />}
                    label="Shuffle"
                  />
                  {loopCount > 0 && (
                    <span className="text-xs text-slate-500">
                      Loops: <b className="text-slate-700">{loopCount}</b>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Loading sentences…</p>
            )}
          </div>

          {/* Now playing */}
          {current && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                {ISLAND_LABELS[current.island] || current.island}
              </span>
              <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                {current.russian}
              </div>
              <div className="mt-0.5 text-sm text-slate-500">
                {current.transliteration}
              </div>
              {showTranslation && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-base text-slate-700">{current.english}</p>
                  {current.notes && (
                    <p className="mt-2 text-xs italic text-slate-400">
                      {current.notes}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="mt-3 text-xs font-medium text-blue-500 transition hover:text-blue-600"
              >
                {showTranslation ? "Hide" : "Show"} translation
              </button>
            </div>
          )}

          {/* Island picker */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Island
            </div>
            <select
              value={island}
              onChange={(e) => {
                setIsland(e.target.value);
                setCurrent(null);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-blue-300 focus:outline-none"
            >
              <option value="all">All sentences ({sentences.length})</option>
              {ISLANDS.map((i) => (
                <option key={i} value={i}>
                  {ISLAND_LABELS[i] || i} ({sentences.filter((s) => s.island === i).length})
                </option>
              ))}
            </select>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Shadowing Tips
            </div>
            <ul className="space-y-2 text-[13px] leading-snug text-slate-600">
              <li>
                <b className="text-slate-800">Shadow out loud:</b> repeat each sentence half a beat behind the speaker.
              </li>
              <li>
                <b className="text-slate-800">Speed up:</b> once familiar, bump to 1.25× or 1.5× so real speech feels slow.
              </li>
              <li>
                <b className="text-slate-800">Predict:</b> after enough loops you should know the next line before it plays.
              </li>
              <li>
                <b className="text-slate-800">Dead time:</b> commute, dishes, warmup — listening time is free.
              </li>
            </ul>
          </div>
        </div>
      </PageCard>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-500/20"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
