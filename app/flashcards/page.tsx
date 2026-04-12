"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/audio-player";
import { loadVerbs } from "@/lib/verbs";
import {
  getProgress,
  updateVerbProgress,
  updateTodayLog,
  getTodayLog,
} from "@/lib/progress";
import type { Verb, VerbProgress } from "@/lib/types";

type FrontSide = "russian" | "english" | "sentence";
type SetupState = {
  mode: "setup";
};
type FlashcardState = {
  mode: "flashcards";
};
type ResultsState = {
  mode: "results";
};
type PageState = SetupState | FlashcardState | ResultsState;

export default function FlashcardsPage() {
  const [allVerbs, setAllVerbs] = useState<Verb[]>([]);
  const [state, setState] = useState<PageState>({ mode: "setup" });
  const [deck, setDeck] = useState<Verb[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<{ rank: number; correct: boolean }[]>(
    []
  );

  // Settings
  const [frontSide, setFrontSide] = useState<FrontSide>("russian");
  const [batchSize, setBatchSize] = useState(30);
  const [startRank, setStartRank] = useState(1);
  const [studyType, setStudyType] = useState<
    "new" | "review" | "mistakes" | "custom"
  >("new");

  useEffect(() => {
    loadVerbs().then(setAllVerbs);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (state.mode !== "flashcards") return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!flipped) {
          setFlipped(true);
        }
      } else if (e.key === "ArrowRight" || e.key === "l") {
        // Correct
        if (flipped) handleAnswer(true);
      } else if (e.key === "ArrowLeft" || e.key === "h") {
        // Wrong
        if (flipped) handleAnswer(false);
      } else if (e.key === "1") {
        if (flipped) handleAnswer(false);
      } else if (e.key === "2" || e.key === "3") {
        if (flipped) handleAnswer(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const buildDeck = useCallback(() => {
    const progress = getProgress();
    let verbs: Verb[] = [];

    if (studyType === "new") {
      const studied = new Set(Object.keys(progress).map(Number));
      verbs = allVerbs.filter((v) => !studied.has(v.rank)).slice(0, batchSize);
    } else if (studyType === "review") {
      const now = new Date().toISOString();
      const dueRanks = Object.values(progress)
        .filter(
          (p: VerbProgress) =>
            p.status !== "mastered" || (p.nextReview && p.nextReview <= now)
        )
        .map((p: VerbProgress) => p.rank);
      verbs = allVerbs
        .filter((v) => dueRanks.includes(v.rank))
        .slice(0, batchSize);
    } else if (studyType === "mistakes") {
      // Cards you've gotten wrong more than right
      const weakRanks = Object.values(progress)
        .filter(
          (p: VerbProgress) =>
            p.incorrectCount > 0 &&
            p.incorrectCount >= p.correctCount
        )
        .sort(
          (a: VerbProgress, b: VerbProgress) =>
            b.incorrectCount - a.incorrectCount
        )
        .map((p: VerbProgress) => p.rank);
      verbs = allVerbs
        .filter((v) => weakRanks.includes(v.rank))
        .slice(0, batchSize);
    } else {
      verbs = allVerbs
        .filter((v) => v.rank >= startRank && v.rank < startRank + batchSize);
    }

    return verbs;
  }, [allVerbs, studyType, batchSize, startRank]);

  const startSession = () => {
    const verbs = buildDeck();
    if (verbs.length === 0) {
      alert("No cards available for this selection.");
      return;
    }
    setDeck(verbs);
    setCurrentIdx(0);
    setFlipped(false);
    setResults([]);
    setState({ mode: "flashcards" });
  };

  const handleAnswer = (correct: boolean) => {
    const verb = deck[currentIdx];
    updateVerbProgress(verb.rank, correct);

    const newResults = [...results, { rank: verb.rank, correct }];
    setResults(newResults);

    const todayLog = getTodayLog();
    updateTodayLog({
      verbsStudied: todayLog.verbsStudied + 1,
      recallCorrect: todayLog.recallCorrect + (correct ? 1 : 0),
      recallIncorrect: todayLog.recallIncorrect + (correct ? 0 : 1),
    });

    if (currentIdx + 1 < deck.length) {
      setCurrentIdx(currentIdx + 1);
      setFlipped(false);
    } else {
      setState({ mode: "results" });
    }
  };

  const currentVerb = deck[currentIdx];
  const progressPercent =
    deck.length > 0 ? Math.round(((currentIdx) / deck.length) * 100) : 0;

  // ─── Setup ───
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
                Card Front (what you see first)
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { key: "russian", label: "Russian Verb" },
                    { key: "english", label: "English" },
                    { key: "sentence", label: "English Sentence" },
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
                {frontSide === "russian"
                  ? "You see the Russian verb and try to recall the English meaning"
                  : frontSide === "english"
                    ? "You see the English verb and try to produce the Russian (active recall — most effective!)"
                    : "You see the English sentence and try to say it in Russian"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Card Selection
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "new", label: "New Verbs" },
                    { key: "review", label: "Review Due" },
                    { key: "mistakes", label: "Weakest Cards" },
                    { key: "custom", label: "Custom Range" },
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

            <div>
              <label className="text-sm font-medium mb-2 block">
                Deck Size: {batchSize}
              </label>
              <div className="flex gap-2">
                {[10, 20, 30, 50, 100].map((n) => (
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

            {studyType === "custom" && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Start from verb #
                </label>
                <input
                  type="number"
                  min={1}
                  max={2000}
                  value={startRank}
                  onChange={(e) => setStartRank(parseInt(e.target.value) || 1)}
                  className="h-8 w-24 rounded-lg border border-input bg-background px-2 text-sm"
                />
              </div>
            )}

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

  // ─── Results ───
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
                const verb = deck.find((v) => v.rank === r.rank);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-6">
                        {verb?.rank}
                      </span>
                      <span className="font-medium">
                        {verb?.russian_verb}
                      </span>
                      <span className="text-muted-foreground">
                        — {verb?.english_verb}
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

        <div className="flex gap-2">
          <Button onClick={() => setState({ mode: "setup" })} variant="outline">
            New Deck
          </Button>
          {wrong > 0 && (
            <Button
              onClick={() => {
                // Retry only the wrong ones
                const wrongRanks = results
                  .filter((r) => !r.correct)
                  .map((r) => r.rank);
                const retryVerbs = deck.filter((v) =>
                  wrongRanks.includes(v.rank)
                );
                setDeck(retryVerbs);
                setCurrentIdx(0);
                setFlipped(false);
                setResults([]);
                setState({ mode: "flashcards" });
              }}
            >
              Retry Wrong Ones ({wrong})
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

  // ─── Flashcard ───
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Flashcards</h1>
        <span className="text-sm text-muted-foreground">
          {currentIdx + 1} / {deck.length}
        </span>
      </div>

      <Progress value={progressPercent} className="mb-6" />

      {currentVerb && (
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
            {/* Front */}
            <Card
              className={`absolute inset-0 backface-hidden ${
                flipped ? "pointer-events-none" : ""
              }`}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] pt-6">
                <span className="text-xs text-muted-foreground mb-4">
                  #{currentVerb.rank} &middot; {currentVerb.category}
                </span>

                {frontSide === "russian" ? (
                  <>
                    <div className="text-4xl font-bold mb-2">
                      {currentVerb.russian_verb}
                    </div>
                    <div className="text-muted-foreground mb-4">
                      {currentVerb.transliteration}
                    </div>
                    <div className="flex items-center gap-2">
                      <AudioPlayer rank={currentVerb.rank} />
                    </div>
                  </>
                ) : frontSide === "english" ? (
                  <>
                    <div className="text-3xl font-bold mb-2">
                      {currentVerb.english_verb}
                    </div>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Try to say the Russian verb aloud
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl text-center font-medium mb-2">
                      &ldquo;{currentVerb.english_sentence}&rdquo;
                    </p>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Try to say this in Russian
                    </p>
                  </>
                )}

                <p className="text-xs text-muted-foreground mt-6">
                  Tap card or press Space to flip
                </p>
              </CardContent>
            </Card>

            {/* Back */}
            <Card
              className={`absolute inset-0 [transform:rotateY(180deg)] backface-hidden ${
                !flipped ? "pointer-events-none" : ""
              }`}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] pt-6">
                <span className="text-xs text-muted-foreground mb-3">
                  #{currentVerb.rank}
                </span>

                <div className="text-3xl font-bold mb-1">
                  {currentVerb.russian_verb}
                </div>
                <div className="text-muted-foreground text-sm mb-1">
                  {currentVerb.transliteration}
                </div>
                <div className="text-lg font-medium mb-3">
                  {currentVerb.english_verb}
                </div>

                <div className="border-t w-full pt-3 text-center">
                  <p className="text-base">{currentVerb.russian_sentence}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentVerb.sentence_transliteration}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentVerb.english_sentence}
                  </p>
                </div>

                <div className="mt-3">
                  <AudioPlayer rank={currentVerb.rank} />
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
