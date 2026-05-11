"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

type FrontSide = "russian" | "english";
type SetupState = { mode: "setup" };
type FlashcardState = { mode: "flashcards" };
type ResultsState = { mode: "results" };
type PageState = SetupState | FlashcardState | ResultsState;

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
      } else if (e.key === "1") {
        if (flipped) handleAnswer(false);
      } else if (e.key === "2" || e.key === "3") {
        if (flipped) handleAnswer(true);
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
      items = allSentences
        .filter((s) => dueIds.includes(s.id))
        .slice(0, batchSize);
    } else if (studyType === "mistakes") {
      const weakIds = Object.values(progress)
        .filter(
          (p: SentenceProgress) =>
            p.incorrectCount > 0 && p.incorrectCount >= p.correctCount
        )
        .sort(
          (a: SentenceProgress, b: SentenceProgress) =>
            b.incorrectCount - a.incorrectCount
        )
        .map((p: SentenceProgress) => p.id);
      items = allSentences
        .filter((s) => weakIds.includes(s.id))
        .slice(0, batchSize);
    } else {
      items = allSentences
        .filter((s) => s.island === islandFilter)
        .slice(0, batchSize);
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

  if (state.mode === "setup") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Flashcards</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configure Deck</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Card Front
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { key: "english", label: "English (active recall)" },
                    { key: "russian", label: "Russian (recognize)" },
                  ] as const
                ).map((opt) => (
                  <Button
                    key={opt.key}
                    variant={frontSide === opt.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFrontSide(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {frontSide === "english"
                  ? "See English → try to say in Russian. Most effective."
                  : "See Russian → recall the meaning."}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Card Selection
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "new", label: "New" },
                    { key: "review", label: "Review Due" },
                    { key: "mistakes", label: "Weakest" },
                    { key: "island", label: "By Island" },
                  ] as const
                ).map((opt) => (
                  <Button
                    key={opt.key}
                    variant={studyType === opt.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStudyType(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {studyType === "island" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Island</label>
                <select
                  value={islandFilter}
                  onChange={(e) => setIslandFilter(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                >
                  {ISLANDS.map((i) => (
                    <option key={i} value={i}>
                      {ISLAND_LABELS[i] || i}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Deck Size: {batchSize}
              </label>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15, 20, 30].map((n) => (
                  <Button
                    key={n}
                    variant={batchSize === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBatchSize(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={startSession} className="w-full" size="lg">
              Start Flashcards
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">Space</kbd>{" "}
              or{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">Enter</kbd>{" "}
              — Flip card
            </p>
            <p>
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">→</kbd>{" "}
              or{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">L</kbd>{" "}
              — Got it right
            </p>
            <p>
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">←</kbd>{" "}
              or{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">H</kbd>{" "}
              — Got it wrong
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.mode === "results") {
    const correct = results.filter((r) => r.correct).length;
    const wrong = results.filter((r) => !r.correct).length;
    const total = results.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Deck Complete!</h1>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold mb-2">{accuracy}%</div>
              <p className="text-muted-foreground">
                {correct} right &middot; {wrong} wrong &middot; {total} total
              </p>
            </div>
            <Progress value={accuracy} className="h-2 mb-6" />

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((r, i) => {
                const item = deck.find((s) => s.id === r.id);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1.5 border-b last:border-0 gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium truncate">
                        {item?.russian}
                      </span>
                      <span className="text-muted-foreground truncate">
                        — {item?.english}
                      </span>
                    </div>
                    <Badge variant={r.correct ? "default" : "destructive"}>
                      {r.correct ? "Right" : "Wrong"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setState({ mode: "setup" })} variant="outline">
            New Deck
          </Button>
          {wrong > 0 && (
            <Button
              onClick={() => {
                const wrongIds = results
                  .filter((r) => !r.correct)
                  .map((r) => r.id);
                const retry = deck.filter((s) => wrongIds.includes(s.id));
                setDeck(retry);
                setCurrentIdx(0);
                setFlipped(false);
                setResults([]);
                setState({ mode: "flashcards" });
              }}
            >
              Retry Wrong ({wrong})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setCurrentIdx(0);
              setFlipped(false);
              setResults([]);
              setState({ mode: "flashcards" });
            }}
          >
            Retry All
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Flashcards</h1>
        <span className="text-sm text-muted-foreground">
          {currentIdx + 1} / {deck.length}
        </span>
      </div>

      <Progress value={progressPercent} className="mb-6" />

      {current && (
        <div
          className="perspective-1000 mb-6 cursor-pointer"
          onClick={() => !flipped && setFlipped(true)}
        >
          <div
            className={`relative transition-transform duration-500 transform-style-3d ${
              flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
            style={{ minHeight: "280px" }}
          >
            <Card
              className={`absolute inset-0 backface-hidden ${
                flipped ? "pointer-events-none" : ""
              }`}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] pt-6 px-6">
                <Badge variant="outline" className="mb-4">
                  {ISLAND_LABELS[current.island] || current.island}
                </Badge>

                {frontSide === "english" ? (
                  <>
                    <p className="text-xl text-center font-medium mb-2">
                      &ldquo;{current.english}&rdquo;
                    </p>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Try to say this in Russian
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-center mb-2">
                      {current.russian}
                    </div>
                    <div className="text-muted-foreground text-center mb-4">
                      {current.transliteration}
                    </div>
                    <AudioPlayer id={current.id} />
                  </>
                )}

                <p className="text-xs text-muted-foreground mt-6">
                  Tap card or press Space to flip
                </p>
              </CardContent>
            </Card>

            <Card
              className={`absolute inset-0 [transform:rotateY(180deg)] backface-hidden ${
                !flipped ? "pointer-events-none" : ""
              }`}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] pt-6 px-6">
                <div className="text-xl font-bold text-center mb-1">
                  {current.russian}
                </div>
                <div className="text-muted-foreground text-sm text-center mb-3">
                  {current.transliteration}
                </div>
                <div className="border-t w-full pt-3 text-center">
                  <p className="text-base">{current.english}</p>
                  {current.notes && (
                    <p className="text-xs text-muted-foreground italic mt-2">
                      {current.notes}
                    </p>
                  )}
                </div>
                <div className="mt-3">
                  <AudioPlayer id={current.id} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {flipped && (
        <div className="flex gap-3 justify-center mb-6">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 max-w-40 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handleAnswer(false)}
          >
            <span className="mr-1">←</span> Wrong
          </Button>
          <Button
            size="lg"
            className="flex-1 max-w-40 bg-green-600 hover:bg-green-700"
            onClick={() => handleAnswer(true)}
          >
            Right <span className="ml-1">→</span>
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setState({ mode: "setup" })}
          className="text-muted-foreground"
        >
          ← Back to setup
        </Button>
        <div className="text-xs text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Space</kbd>{" "}
          flip &middot;{" "}
          <kbd className="px-1 py-0.5 rounded bg-muted font-mono">←</kbd>{" "}
          wrong &middot;{" "}
          <kbd className="px-1 py-0.5 rounded bg-muted font-mono">→</kbd>{" "}
          right
        </div>
      </div>
    </div>
  );
}
