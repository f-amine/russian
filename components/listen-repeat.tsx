"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Volume2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sentence } from "@/lib/types";

const audioSrc = (id: number) => `/audio/${String(id).padStart(4, "0")}.mp3`;

export function ListenRepeat({
  sentences,
  ratings,
  onRate,
}: {
  sentences: Sentence[];
  ratings: Record<number, number>;
  onRate: (id: number, stars: number) => void;
}) {
  const [translate, setTranslate] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const current = sentences[activeIdx];

  const playId = useCallback(
    (idx: number) => {
      const s = sentences[idx];
      if (!s) return;
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(audioSrc(s.id));
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      audioRef.current = audio;
      audio.play().catch(() => setPlaying(false));
      setActiveIdx(idx);
      setPlaying(true);
    },
    [sentences]
  );

  useEffect(() => {
    const el = itemRefs.current[activeIdx];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  const toggle = () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      playId(activeIdx);
    }
  };

  const next = () =>
    activeIdx + 1 < sentences.length && playId(activeIdx + 1);
  const prev = () => activeIdx > 0 && playId(activeIdx - 1);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1 pb-3">
        <button
          aria-label="Favorite"
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-amber-500"
        >
          <Star className="h-4 w-4" />
        </button>

        <label className="flex cursor-pointer items-center gap-2 select-none">
          <span className="text-sm font-medium text-slate-700">Translate</span>
          <span className="relative inline-flex">
            <input
              type="checkbox"
              checked={translate}
              onChange={(e) => setTranslate(e.target.checked)}
              className="peer sr-only"
            />
            <span className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-blue-500" />
            <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
          </span>
        </label>

        <div className="flex items-center gap-1">
          <button
            aria-label="Star filter"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-amber-500"
          >
            <Star className="h-4 w-4" />
          </button>
          <button
            aria-label="Search"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-3 pb-28">
          {sentences.map((s, i) => {
            const isActive = i === activeIdx;
            const stars = ratings[s.id] ?? 0;
            return (
              <div
                key={s.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className={cn(
                  "group rounded-xl border bg-white px-4 py-3.5 transition-all",
                  isActive
                    ? "border-blue-300 ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-slate-400">
                      #{i + 1}
                    </span>
                    <button
                      onClick={() => playId(i)}
                      className="grid h-6 w-6 place-items-center rounded-full text-blue-500 transition hover:bg-blue-50"
                      aria-label="Play"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <StarRow
                    value={stars}
                    onChange={(v) => onRate(s.id, v)}
                  />
                </div>
                <div className="text-[17px] font-semibold text-slate-800">
                  {s.russian}
                </div>
                {translate ? (
                  <div className="mt-1 text-sm text-slate-500">
                    {s.english}
                    {s.transliteration && (
                      <span className="text-slate-400">
                        {" · "}
                        {s.transliteration}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-0.5 text-sm font-medium text-blue-500/80">
                    Tap to reveal
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player bar */}
      <div className="pointer-events-none sticky bottom-0 -mx-6 -mb-6 px-6 pb-4 pt-2">
        <div className="pointer-events-auto flex items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-md backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">
                #{activeIdx + 1}
              </span>
              <span>·</span>
              <span className="truncate font-medium text-slate-700">
                {current?.russian}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Tap play to continue · Rep 1× · 1×
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prev}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
              aria-label="Previous"
            >
              <SkipBack className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={toggle}
              className="grid h-11 w-11 place-items-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-600"
              aria-label="Play/Pause"
            >
              {playing ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current pl-0.5" />
              )}
            </button>
            <button
              onClick={next}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
              aria-label="Next"
            >
              <SkipForward className="h-4 w-4 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={(e) => {
            e.stopPropagation();
            onChange(n === value ? 0 : n);
          }}
          className="p-0.5"
          aria-label={`Rate ${n} stars`}
        >
          <Star
            className={cn(
              "h-4 w-4 transition",
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300 hover:text-amber-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
