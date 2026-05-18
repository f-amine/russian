"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Settings as SettingsIcon,
} from "lucide-react";
import { PageCard } from "@/components/page-card";
import { AudioPlayer } from "@/components/audio-player";
import { WordBreakdown } from "@/components/word-breakdown";
import { loadSentences } from "@/lib/sentences";
import {
  getProgress,
  updateSentenceProgress,
  updateTodayLog,
  getTodayLog,
} from "@/lib/progress";
import type { Confidence } from "@/lib/progress";
import type { Sentence, SentenceProgress } from "@/lib/types";
import { ISLAND_LABELS, ISLANDS } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "setup" | "learn" | "recall" | "results";

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function StudyPage() {
  const [allSentences, setAllSentences] = useState<Sentence[]>([]);
  const [mode, setMode] = useState<Mode>("setup");
  const [sessionItems, setSessionItems] = useState<Sentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<
    { id: number; correct: boolean; confidence: Confidence; nextReview: string | null }[]
  >([]);
  const [batchSize, setBatchSize] = useState(10);
  const [studyType, setStudyType] = useState<"new" | "review" | "island">("new");
  const [islandFilter, setIslandFilter] = useState<string>("greetings_basics");

  useEffect(() => {
    loadSentences().then(setAllSentences);
  }, []);

  const startRecall = useCallback(() => {
    setSessionItems((prev) => shuffleArray(prev));
    setCurrentIdx(0);
    setShowAnswer(false);
    setResults([]);
    setMode("recall");
  }, []);

  const handleAnswer = useCallback(
    (confidence: Confidence) => {
      const item = sessionItems[currentIdx];
      const correct = confidence !== "wrong";
      const updated = updateSentenceProgress(item.id, correct, confidence);

      setResults((prev) => [
        ...prev,
        { id: item.id, correct, confidence, nextReview: updated.nextReview },
      ]);

      const todayLog = getTodayLog();
      updateTodayLog({
        sentencesStudied: todayLog.sentencesStudied + 1,
        recallCorrect: todayLog.recallCorrect + (correct ? 1 : 0),
        recallIncorrect: todayLog.recallIncorrect + (correct ? 0 : 1),
      });

      if (currentIdx + 1 < sessionItems.length) {
        setCurrentIdx(currentIdx + 1);
        setShowAnswer(false);
      } else {
        setMode("results");
      }
    },
    [sessionItems, currentIdx]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (mode === "learn") {
        if (e.key === "ArrowRight" || e.key === "l") {
          e.preventDefault();
          if (currentIdx < sessionItems.length - 1) setCurrentIdx((i) => i + 1);
        } else if (e.key === "ArrowLeft" || e.key === "h") {
          e.preventDefault();
          if (currentIdx > 0) setCurrentIdx((i) => i - 1);
        } else if (
          (e.key === "Enter" || e.key === " ") &&
          currentIdx === sessionItems.length - 1
        ) {
          e.preventDefault();
          startRecall();
        }
      } else if (mode === "recall") {
        if (!showAnswer) {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setShowAnswer(true);
          }
        } else {
          if (e.key === "1") handleAnswer("wrong");
          else if (e.key === "2") handleAnswer("hard");
          else if (e.key === "3") handleAnswer("good");
          else if (e.key === "4") handleAnswer("easy");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, currentIdx, showAnswer, sessionItems.length, startRecall, handleAnswer]);

  const startSession = useCallback(() => {
    let items: Sentence[] = [];
    const progress = getProgress();

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
    } else {
      items = allSentences.filter((s) => s.island === islandFilter).slice(0, batchSize);
    }

    if (items.length === 0) {
      alert("No sentences available for this selection. Try a different option.");
      return;
    }

    setSessionItems(items);
    setCurrentIdx(0);
    setShowAnswer(false);
    setResults([]);
    setMode("learn");
  }, [allSentences, studyType, batchSize, islandFilter]);

  const retryWrongOnly = () => {
    const wrongIds = new Set(results.filter((r) => !r.correct).map((r) => r.id));
    const wrong = sessionItems.filter((s) => wrongIds.has(s.id));
    setSessionItems(shuffleArray(wrong));
    setCurrentIdx(0);
    setShowAnswer(false);
    setResults([]);
    setMode("recall");
  };

  const current = sessionItems[currentIdx];
  const progressPercent =
    sessionItems.length > 0
      ? Math.round(((currentIdx + 1) / sessionItems.length) * 100)
      : 0;

  return (
    <div className="flex h-full w-full">
      <PageCard
        backHref="/"
        title={mode === "setup" ? "Study Session" : mode === "results" ? "Session Complete" : mode === "learn" ? "Learn" : "Active Recall"}
        subtitle={
          mode === "setup"
            ? "Configure your batch"
            : mode === "results"
              ? "Review your run"
              : `${currentIdx + 1} of ${sessionItems.length}`
        }
        actions={
          mode !== "setup" &&
          mode !== "results" && (
            <button
              onClick={() => setMode("setup")}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:text-slate-700"
              aria-label="Restart"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
          )
        }
      >
        {mode === "setup" ? (
          <SetupView
            studyType={studyType}
            setStudyType={setStudyType}
            islandFilter={islandFilter}
            setIslandFilter={setIslandFilter}
            batchSize={batchSize}
            setBatchSize={setBatchSize}
            onStart={startSession}
          />
        ) : mode === "results" ? (
          <ResultsView
            results={results}
            sessionItems={sessionItems}
            onNew={() => setMode("setup")}
            onRetryWrong={retryWrongOnly}
            onRetryAll={() => {
              setSessionItems((prev) => shuffleArray(prev));
              setCurrentIdx(0);
              setShowAnswer(false);
              setResults([]);
              setMode("recall");
            }}
          />
        ) : (
          <SessionView
            mode={mode}
            current={current}
            progressPercent={progressPercent}
            currentIdx={currentIdx}
            total={sessionItems.length}
            showAnswer={showAnswer}
            setShowAnswer={setShowAnswer}
            onAnswer={handleAnswer}
            onPrev={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
            onNext={() =>
              currentIdx < sessionItems.length - 1 && setCurrentIdx(currentIdx + 1)
            }
            onStartRecall={startRecall}
          />
        )}
      </PageCard>
    </div>
  );
}

/* ---------------- subviews ---------------- */

function SetupView({
  studyType,
  setStudyType,
  islandFilter,
  setIslandFilter,
  batchSize,
  setBatchSize,
  onStart,
}: {
  studyType: "new" | "review" | "island";
  setStudyType: (v: "new" | "review" | "island") => void;
  islandFilter: string;
  setIslandFilter: (v: string) => void;
  batchSize: number;
  setBatchSize: (v: number) => void;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Section title="Study Type">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: "new", label: "New" },
              { key: "review", label: "Review Due" },
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

      <Section title={`Batch Size: ${batchSize}`}>
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
        Start Session
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function SessionView({
  mode,
  current,
  progressPercent,
  currentIdx,
  total,
  showAnswer,
  setShowAnswer,
  onAnswer,
  onPrev,
  onNext,
  onStartRecall,
}: {
  mode: Mode;
  current: Sentence | undefined;
  progressPercent: number;
  currentIdx: number;
  total: number;
  showAnswer: boolean;
  setShowAnswer: (v: boolean) => void;
  onAnswer: (c: Confidence) => void;
  onPrev: () => void;
  onNext: () => void;
  onStartRecall: () => void;
}) {
  if (!current) return null;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
            {ISLAND_LABELS[current.island] || current.island}
          </span>
          <span>
            {currentIdx + 1} / {total}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        {mode === "learn" ? (
          <>
            <div className="text-2xl font-bold text-slate-900">
              {current.russian}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {current.transliteration}
            </div>
            <div className="mt-3 text-base text-slate-700">
              {current.english}
            </div>
            {current.notes && (
              <div className="mt-2 text-xs italic text-slate-400">
                {current.notes}
              </div>
            )}

            <div className="mt-5 flex justify-center">
              <AudioPlayer id={current.id} />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5 text-left">
              <WordBreakdown
                russianSentence={current.russian}
                transliteration={current.transliteration}
                englishSentence={current.english}
              />
            </div>
          </>
        ) : (
          <>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Say this in Russian
            </div>
            <div className="mt-3 text-xl font-semibold text-slate-900">
              “{current.english}”
            </div>
            {current.notes && (
              <div className="mt-2 text-xs italic text-slate-400">
                {current.notes}
              </div>
            )}

            {showAnswer ? (
              <>
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="text-2xl font-bold text-slate-900">
                    {current.russian}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {current.transliteration}
                  </div>
                  <div className="mt-3 flex justify-center">
                    <AudioPlayer id={current.id} />
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Try aloud, then reveal · <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">Space</kbd>
              </p>
            )}
          </>
        )}
      </div>

      {mode === "learn" ? (
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>
          {currentIdx < total - 1 ? (
            <button
              onClick={onNext}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-600"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onStartRecall}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-600"
            >
              Start Recall <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : !showAnswer ? (
        <button
          onClick={() => setShowAnswer(true)}
          className="mt-5 w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-600"
        >
          Show Answer
        </button>
      ) : (
        <div className="mt-5 grid grid-cols-4 gap-2">
          <RecallBtn tone="red" label="Wrong" hint="1" onClick={() => onAnswer("wrong")} />
          <RecallBtn tone="orange" label="Hard" hint="2" onClick={() => onAnswer("hard")} />
          <RecallBtn tone="emerald" label="Good" hint="3" onClick={() => onAnswer("good")} />
          <RecallBtn tone="emerald-solid" label="Easy" hint="4" onClick={() => onAnswer("easy")} />
        </div>
      )}
    </div>
  );
}

function ResultsView({
  results,
  sessionItems,
  onNew,
  onRetryWrong,
  onRetryAll,
}: {
  results: { id: number; correct: boolean; confidence: Confidence; nextReview: string | null }[];
  sessionItems: Sentence[];
  onNew: () => void;
  onRetryWrong: () => void;
  onRetryAll: () => void;
}) {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrongCount = results.filter((r) => !r.correct).length;

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
        <div className="text-5xl font-bold tabular-nums text-slate-900">
          {accuracy}%
        </div>
        <div className="mt-1 text-sm text-slate-500">
          {correct} of {total} correct
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {results.map((r, i) => {
          const item = sessionItems.find((s) => s.id === r.id);
          const reviewDate = r.nextReview
            ? new Date(r.nextReview).toLocaleDateString()
            : null;
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-slate-700">
                <b className="font-semibold text-slate-900">{item?.russian}</b>{" "}
                <span className="text-slate-500">— {item?.english}</span>
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {reviewDate && (
                  <span className="text-[11px] text-slate-400">{reviewDate}</span>
                )}
                <ConfidenceBadge value={r.confidence} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={onNew}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          New Session
        </button>
        {wrongCount > 0 && (
          <button
            onClick={onRetryWrong}
            className="flex-1 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
          >
            Retry Wrong ({wrongCount})
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

/* ---------------- bits ---------------- */

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

function RecallBtn({
  tone,
  label,
  hint,
  onClick,
}: {
  tone: "red" | "orange" | "emerald" | "emerald-solid";
  label: string;
  hint: string;
  onClick: () => void;
}) {
  const tones = {
    red: "border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
    orange: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    "emerald-solid": "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600",
  } as const;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border py-3 text-sm font-semibold transition",
        tones[tone]
      )}
    >
      <span>{label}</span>
      <span className="mt-0.5 text-[10px] opacity-70">{hint}</span>
    </button>
  );
}

function ConfidenceBadge({ value }: { value: Confidence }) {
  const map = {
    wrong: "bg-red-100 text-red-700",
    hard: "bg-amber-100 text-amber-700",
    good: "bg-emerald-100 text-emerald-700",
    easy: "bg-emerald-500 text-white",
  } as const;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
        map[value]
      )}
    >
      {value}
    </span>
  );
}
