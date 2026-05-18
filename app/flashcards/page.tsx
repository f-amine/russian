"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { PageCard } from "@/components/page-card";
import { AudioPlayer } from "@/components/audio-player";
import { loadSentences } from "@/lib/sentences";
import {
  getProgress,
  updateSentenceProgress,
  updateTodayLog,
  getTodayLog,
} from "@/lib/progress";
import type { Sentence, SentenceProgress } from "@/lib/types";
import { ISLAND_LABELS, ISLANDS } from "@/lib/types";
import { cn } from "@/lib/utils";

type FrontSide = "russian" | "english";
type PageState = { mode: "setup" | "flashcards" | "results" };

export default function FlashcardsPage() {
  const [allSentences, setAllSentences] = useState<Sentence[]>([]);
  const [state, setState] = useState<PageState>({ mode: "setup" });
  const [deck, setDeck] = useState<Sentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<{ id: number; correct: boolean }[]>([]);

  const [frontSide, setFrontSide] = useState<FrontSide>("english");
  const [batchSize, setBatchSize] = useState(15);
  const [studyType, setStudyType] = useState<
    "new" | "review" | "mistakes" | "island"
  >("new");
  const [islandFilter, setIslandFilter] = useState<string>("greetings_basics");

  useEffect(() => {
    loadSentences().then(setAllSentences);
  }, []);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      const item = deck[currentIdx];
      updateSentenceProgress(item.id, correct);
      setResults((prev) => [...prev, { id: item.id, correct }]);

      const todayLog = getTodayLog();
      updateTodayLog({
        sentencesStudied: todayLog.sentencesStudied + 1,
        recallCorrect: todayLog.recallCorrect + (correct ? 1 : 0),
        recallIncorrect: todayLog.recallIncorrect + (correct ? 0 : 1),
      });

      if (currentIdx + 1 < deck.length) {
        setCurrentIdx(currentIdx + 1);
        setFlipped(false);
      } else {
        setState({ mode: "results" });
      }
    },
    [deck, currentIdx]
  );

  useEffect(() => {
    if (state.mode !== "flashcards") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!flipped) setFlipped(true);
      } else if (e.key === "ArrowRight" || e.key === "l") {
        if (flipped) handleAnswer(true);
      } else if (e.key === "ArrowLeft" || e.key === "h") {
        if (flipped) handleAnswer(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.mode, flipped, handleAnswer]);

  const buildDeck = useCallback(() => {
    const progress = getProgress();
    let items: Sentence[] = [];

    if (studyType === "new") {
      const studied = new Set(Object.keys(progress).map(Number));
      items = allSentences.filter((s) => !studied.has(s.id)).slice(0, batchSize);
    } else if (studyType === "review") {
      const now = new Date().toISOString();
      const dueIds = Object.values(progress)
        .filter(
          (p: SentenceProgress) =>
            p.status !== "mastered" || (p.nextReview && p.nextReview <= now)
        )
        .map((p: SentenceProgress) => p.id);
      items = allSentences.filter((s) => dueIds.includes(s.id)).slice(0, batchSize);
    } else if (studyType === "mistakes") {
      const weakIds = Object.values(progress)
        .filter(
          (p: SentenceProgress) =>
            p.incorrectCount > 0 && p.incorrectCount >= p.correctCount
        )
        .sort((a, b) => b.incorrectCount - a.incorrectCount)
        .map((p) => p.id);
      items = allSentences.filter((s) => weakIds.includes(s.id)).slice(0, batchSize);
    } else {
      items = allSentences.filter((s) => s.island === islandFilter).slice(0, batchSize);
    }

    return items;
  }, [allSentences, studyType, batchSize, islandFilter]);

  const startSession = () => {
    const items = buildDeck();
    if (items.length === 0) {
      alert("No cards available for this selection.");
      return;
    }
    setDeck(items);
    setCurrentIdx(0);
    setFlipped(false);
    setResults([]);
    setState({ mode: "flashcards" });
  };

  const current = deck[currentIdx];
  const progressPercent =
    deck.length > 0 ? Math.round((currentIdx / deck.length) * 100) : 0;

  return (
    <div className="flex h-full w-full">
      <PageCard
        backHref="/"
        title={
          state.mode === "setup"
            ? "Flashcards"
            : state.mode === "results"
              ? "Deck Complete"
              : "Flashcards"
        }
        subtitle={
          state.mode === "flashcards"
            ? `${currentIdx + 1} of ${deck.length}`
            : state.mode === "setup"
              ? "Configure deck"
              : "Review your run"
        }
      >
        {state.mode === "setup" ? (
          <SetupView
            studyType={studyType}
            setStudyType={setStudyType}
            islandFilter={islandFilter}
            setIslandFilter={setIslandFilter}
            batchSize={batchSize}
            setBatchSize={setBatchSize}
            frontSide={frontSide}
            setFrontSide={setFrontSide}
            onStart={startSession}
          />
        ) : state.mode === "results" ? (
          <ResultsView
            results={results}
            deck={deck}
            onNew={() => setState({ mode: "setup" })}
            onRetryWrong={() => {
              const wrongIds = results.filter((r) => !r.correct).map((r) => r.id);
              const retry = deck.filter((s) => wrongIds.includes(s.id));
              setDeck(retry);
              setCurrentIdx(0);
              setFlipped(false);
              setResults([]);
              setState({ mode: "flashcards" });
            }}
            onRetryAll={() => {
              setCurrentIdx(0);
              setFlipped(false);
              setResults([]);
              setState({ mode: "flashcards" });
            }}
          />
        ) : current ? (
          <SessionView
            current={current}
            frontSide={frontSide}
            flipped={flipped}
            setFlipped={setFlipped}
            onAnswer={handleAnswer}
            progressPercent={progressPercent}
          />
        ) : null}
      </PageCard>
    </div>
  );
}

/* -------- subviews -------- */

function SetupView({
  studyType,
  setStudyType,
  islandFilter,
  setIslandFilter,
  batchSize,
  setBatchSize,
  frontSide,
  setFrontSide,
  onStart,
}: {
  studyType: "new" | "review" | "mistakes" | "island";
  setStudyType: (v: "new" | "review" | "mistakes" | "island") => void;
  islandFilter: string;
  setIslandFilter: (v: string) => void;
  batchSize: number;
  setBatchSize: (v: number) => void;
  frontSide: FrontSide;
  setFrontSide: (v: FrontSide) => void;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Section title="Card Front">
        <div className="grid grid-cols-2 gap-2">
          <ChoiceChip
            active={frontSide === "english"}
            onClick={() => setFrontSide("english")}
          >
            English (active recall)
          </ChoiceChip>
          <ChoiceChip
            active={frontSide === "russian"}
            onClick={() => setFrontSide("russian")}
          >
            Russian (recognize)
          </ChoiceChip>
        </div>
      </Section>

      <Section title="Card Selection">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {(
            [
              { key: "new", label: "New" },
              { key: "review", label: "Review Due" },
              { key: "mistakes", label: "Weakest" },
              { key: "island", label: "By Island" },
            ] as const
          ).map((t) => (
            <ChoiceChip
              key={t.key}
              active={studyType === t.key}
              onClick={() => setStudyType(t.key)}
            >
              {t.label}
            </ChoiceChip>
          ))}
        </div>
      </Section>

      {studyType === "island" && (
        <Section title="Island">
          <select
            value={islandFilter}
            onChange={(e) => setIslandFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-blue-300 focus:outline-none"
          >
            {ISLANDS.map((i) => (
              <option key={i} value={i}>
                {ISLAND_LABELS[i] || i}
              </option>
            ))}
          </select>
        </Section>
      )}

      <Section title={`Deck Size: ${batchSize}`}>
        <div className="grid grid-cols-5 gap-2">
          {[5, 10, 15, 20, 30].map((n) => (
            <ChoiceChip
              key={n}
              active={batchSize === n}
              onClick={() => setBatchSize(n)}
            >
              {n}
            </ChoiceChip>
          ))}
        </div>
      </Section>

      <button
        onClick={onStart}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-600"
      >
        Start Flashcards
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function SessionView({
  current,
  frontSide,
  flipped,
  setFlipped,
  onAnswer,
  progressPercent,
}: {
  current: Sentence;
  frontSide: FrontSide;
  flipped: boolean;
  setFlipped: (v: boolean) => void;
  onAnswer: (correct: boolean) => void;
  progressPercent: number;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div
        onClick={() => !flipped && setFlipped(true)}
        className="perspective-1000 mb-5 cursor-pointer"
      >
        <div
          className={cn(
            "relative transition-transform duration-500 transform-style-3d",
            flipped && "[transform:rotateY(180deg)]"
          )}
          style={{ minHeight: "320px" }}
        >
          {/* Front */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm backface-hidden",
              flipped && "pointer-events-none"
            )}
          >
            <span className="mb-4 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              {ISLAND_LABELS[current.island] || current.island}
            </span>
            {frontSide === "english" ? (
              <>
                <div className="text-xl font-semibold text-slate-900">
                  “{current.english}”
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Try to say in Russian — tap to flip
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900">
                  {current.russian}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {current.transliteration}
                </div>
                <div className="mt-4">
                  <AudioPlayer id={current.id} />
                </div>
                <p className="mt-3 text-xs text-slate-500">Tap to flip</p>
              </>
            )}
          </div>

          {/* Back */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm backface-hidden [transform:rotateY(180deg)]",
              !flipped && "pointer-events-none"
            )}
          >
            <div className="text-2xl font-bold text-slate-900">
              {current.russian}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {current.transliteration}
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3 text-base text-slate-700">
              {current.english}
            </div>
            {current.notes && (
              <div className="mt-2 text-xs italic text-slate-400">
                {current.notes}
              </div>
            )}
            <div className="mt-4">
              <AudioPlayer id={current.id} />
            </div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAnswer(false)}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Wrong
          </button>
          <button
            onClick={() => onAnswer(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-600"
          >
            Right
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-500">
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
            Space
          </kbd>{" "}
          flip ·{" "}
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
            ←
          </kbd>{" "}
          wrong ·{" "}
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
            →
          </kbd>{" "}
          right
        </p>
      )}
    </div>
  );
}

function ResultsView({
  results,
  deck,
  onNew,
  onRetryWrong,
  onRetryAll,
}: {
  results: { id: number; correct: boolean }[];
  deck: Sentence[];
  onNew: () => void;
  onRetryWrong: () => void;
  onRetryAll: () => void;
}) {
  const correct = results.filter((r) => r.correct).length;
  const wrong = results.filter((r) => !r.correct).length;
  const total = results.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
        <div className="text-5xl font-bold tabular-nums text-slate-900">
          {accuracy}%
        </div>
        <div className="mt-1 text-sm text-slate-500">
          {correct} right · {wrong} wrong · {total} total
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      <div className="mt-4 max-h-80 space-y-1.5 overflow-y-auto">
        {results.map((r, i) => {
          const item = deck.find((s) => s.id === r.id);
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-slate-700">
                <b className="font-semibold text-slate-900">{item?.russian}</b>{" "}
                <span className="text-slate-500">— {item?.english}</span>
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  r.correct
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {r.correct ? "Right" : "Wrong"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={onNew}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          New Deck
        </button>
        {wrong > 0 && (
          <button
            onClick={onRetryWrong}
            className="flex-1 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
          >
            Retry Wrong ({wrong})
          </button>
        )}
        <button
          onClick={onRetryAll}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-600"
        >
          <RotateCcw className="h-4 w-4" />
          Retry All
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </div>
      {children}
    </div>
  );
}

function ChoiceChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2.5 text-sm font-medium transition",
        active
          ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/20"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      )}
    >
      {children}
    </button>
  );
}
