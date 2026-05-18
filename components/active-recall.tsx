"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sentence } from "@/lib/types";

const audioSrc = (id: number) => `/audio/${String(id).padStart(4, "0")}.mp3`;

export function ActiveRecall({
  sentences,
  ratings,
  onRate,
}: {
  sentences: Sentence[];
  ratings: Record<number, number>;
  onRate: (id: number, stars: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = sentences[idx];
  const stars = current ? ratings[current.id] ?? 0 : 0;

  const play = useCallback(() => {
    if (!current) return;
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(audioSrc(current.id));
    audioRef.current = a;
    a.play().catch(() => {});
  }, [current]);

  const advance = (dir: 1 | -1) => {
    const n = idx + dir;
    if (n < 0 || n >= sentences.length) return;
    setIdx(n);
    setRevealed(false);
  };

  if (!current) return null;

  return (
    <div className="flex h-full flex-col items-center justify-between">
      {/* Card */}
      <button
        onClick={() => {
          if (!revealed) {
            setRevealed(true);
            play();
          }
        }}
        className={cn(
          "group relative mx-auto mt-4 flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl border bg-white px-8 py-12 text-center transition-all",
          "border-slate-200 shadow-sm hover:shadow-md",
          "min-h-[340px]"
        )}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              play();
            }}
            className="text-emerald-500 transition hover:text-emerald-600"
            aria-label="Play audio"
          >
            <Volume2 className="h-7 w-7" />
          </button>
        </div>

        <div className="mt-6 text-2xl font-semibold tracking-tight text-slate-800">
          {current.english}
        </div>

        {revealed ? (
          <div className="mt-4 space-y-1">
            <div className="text-2xl font-bold text-slate-900">
              {current.russian}
            </div>
            <div className="text-sm text-slate-500">
              {current.transliteration}
            </div>
            {current.notes && (
              <div className="mt-2 text-xs italic text-slate-400">
                {current.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 text-sm font-medium text-emerald-500">
            Tap card to reveal translation
          </div>
        )}

        <div className="mt-8">
          <div className="text-[11px] font-medium text-slate-400">
            Rate your knowledge
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={(e) => {
                  e.stopPropagation();
                  onRate(current.id, n === stars ? 0 : n);
                }}
                aria-label={`Rate ${n}`}
                className="p-1"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition",
                    n <= stars
                      ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                      : "text-slate-300 hover:text-amber-300"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </button>

      {/* Pagination */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={() => advance(-1)}
          disabled={idx === 0}
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((d) => {
            const dotIdx = Math.min(
              Math.max(idx - 1 + d, 0),
              sentences.length - 1
            );
            const active = dotIdx === idx;
            return (
              <span
                key={d}
                className={cn(
                  "h-2 rounded-full transition-all",
                  active ? "w-6 bg-emerald-400" : "w-2 bg-slate-300"
                )}
              />
            );
          })}
        </div>

        <button
          onClick={() => advance(1)}
          disabled={idx === sentences.length - 1}
          className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:opacity-30"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
