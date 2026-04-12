"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/audio-player";
import { WordBreakdown } from "@/components/word-breakdown";
import { loadVerbs } from "@/lib/verbs";
import {
  getProgress,
  updateVerbProgress,
  updateTodayLog,
  getTodayLog,
} from "@/lib/progress";
import type { Confidence } from "@/lib/progress";
import type { Verb, VerbProgress } from "@/lib/types";

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
  const [allVerbs, setAllVerbs] = useState<Verb[]>([]);
  const [mode, setMode] = useState<Mode>("setup");
  const [sessionVerbs, setSessionVerbs] = useState<Verb[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<
    { rank: number; correct: boolean; confidence: Confidence; nextReview: string | null }[]
  >([]);
  const [batchSize, setBatchSize] = useState(30);
  const [startRank, setStartRank] = useState(1);
  const [studyType, setStudyType] = useState<"new" | "review" | "custom">(
    "new"
  );

  useEffect(() => {
    loadVerbs().then(setAllVerbs);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (mode === "learn") {
        if (e.key === "ArrowRight" || e.key === "l") {
          e.preventDefault();
          if (currentIdx < sessionVerbs.length - 1) {
            setCurrentIdx((i) => i + 1);
          }
        } else if (e.key === "ArrowLeft" || e.key === "h") {
          e.preventDefault();
          if (currentIdx > 0) {
            setCurrentIdx((i) => i - 1);
          }
        } else if ((e.key === "Enter" || e.key === " ") && currentIdx === sessionVerbs.length - 1) {
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
          if (e.key === "1") {
            e.preventDefault();
            handleAnswer("wrong");
          } else if (e.key === "2") {
            e.preventDefault();
            handleAnswer("hard");
          } else if (e.key === "3") {
            e.preventDefault();
            handleAnswer("good");
          } else if (e.key === "4") {
            e.preventDefault();
            handleAnswer("easy");
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, currentIdx, showAnswer, sessionVerbs.length]);

  const startSession = useCallback(() => {
    let verbs: Verb[] = [];
    const progress = getProgress();

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
    } else {
      verbs = allVerbs
        .filter((v) => v.rank >= startRank && v.rank < startRank + batchSize)
        .slice(0, batchSize);
    }

    if (verbs.length === 0) {
      alert("No verbs available for this selection. Try a different option.");
      return;
    }

    setSessionVerbs(verbs);
    setCurrentIdx(0);
    setShowAnswer(false);
    setResults([]);
    setMode("learn");
  }, [allVerbs, studyType, batchSize, startRank]);

  const startRecall = () => {
    setSessionVerbs((prev) => shuffleArray(prev));
    setCurrentIdx(0);
    setShowAnswer(false);
    setResults([]);
    setMode("recall");
  };

  const handleAnswer = (confidence: Confidence) => {
    const verb = sessionVerbs[currentIdx];
    const correct = confidence !== "wrong";
    const updated = updateVerbProgress(verb.rank, correct, confidence);

    const newResults = [
      ...results,
      { rank: verb.rank, correct, confidence, nextReview: updated.nextReview },
    ];
    setResults(newResults);

    const todayLog = getTodayLog();
    updateTodayLog({
      verbsStudied: todayLog.verbsStudied + 1,
      recallCorrect: todayLog.recallCorrect + (correct ? 1 : 0),
      recallIncorrect: todayLog.recallIncorrect + (correct ? 0 : 1),
    });

    if (currentIdx + 1 < sessionVerbs.length) {
      setCurrentIdx(currentIdx + 1);
      setShowAnswer(false);
    } else {
      setMode("results");
    }
  };

  const retryWrongOnly = () => {
    const wrongRanks = new Set(
      results.filter((r) => !r.correct).map((r) => r.rank)
    );
    const wrongVerbs = sessionVerbs.filter((v) => wrongRanks.has(v.rank));
    setSessionVerbs(shuffleArray(wrongVerbs));
    setCurrentIdx(0);
    setShowAnswer(false);
    setResults([]);
    setMode("recall");
  };

  const currentVerb = sessionVerbs[currentIdx];
  const progressPercent =
    sessionVerbs.length > 0
      ? Math.round(((currentIdx + 1) / sessionVerbs.length) * 100)
      : 0;

  if (mode === "setup") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Study Session</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configure Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Study Type
              </label>
              <div className="flex gap-2">
                {(["new", "review", "custom"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={studyType === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStudyType(t)}
                  >
                    {t === "new"
                      ? "New Verbs"
                      : t === "review"
                        ? "Review Due"
                        : "Custom Range"}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Batch Size: {batchSize}
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
              Start Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "results") {
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const wrongCount = results.filter((r) => !r.correct).length;

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Session Complete!</h1>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold mb-2">{accuracy}%</div>
              <p className="text-muted-foreground">
                {correct} correct out of {total}
              </p>
            </div>
            <Progress value={accuracy} className="h-2 mb-6" />

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((r, i) => {
                const verb = sessionVerbs.find((v) => v.rank === r.rank);
                const reviewDate = r.nextReview
                  ? new Date(r.nextReview).toLocaleDateString()
                  : null;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                  >
                    <span>
                      {verb?.russian_verb}{" "}
                      <span className="text-muted-foreground">
                        — {verb?.english_verb}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      {reviewDate && (
                        <span className="text-xs text-muted-foreground">
                          Review: {reviewDate}
                        </span>
                      )}
                      <Badge
                        variant={
                          r.confidence === "wrong"
                            ? "destructive"
                            : r.confidence === "hard"
                              ? "outline"
                              : "default"
                        }
                      >
                        {r.confidence === "wrong"
                          ? "Wrong"
                          : r.confidence === "hard"
                            ? "Hard"
                            : r.confidence === "easy"
                              ? "Easy"
                              : "Good"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={() => setMode("setup")} variant="outline">
            New Session
          </Button>
          {wrongCount > 0 && (
            <Button onClick={retryWrongOnly} variant="outline">
              Retry Wrong ({wrongCount})
            </Button>
          )}
          <Button
            onClick={() => {
              setSessionVerbs((prev) => shuffleArray(prev));
              setCurrentIdx(0);
              setShowAnswer(false);
              setResults([]);
              setMode("recall");
            }}
          >
            Retry All Verbs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">
          {mode === "learn" ? "Learn" : "Active Recall"}
        </h1>
        <span className="text-sm text-muted-foreground">
          {currentIdx + 1} / {sessionVerbs.length}
        </span>
      </div>

      <Progress value={progressPercent} className="mb-6" />

      {currentVerb && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            {mode === "learn" ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    {currentVerb.russian_verb}
                  </div>
                  <div className="text-muted-foreground">
                    {currentVerb.transliteration}
                  </div>
                  <div className="text-lg mt-2">{currentVerb.english_verb}</div>
                  <Badge variant="outline" className="mt-2">
                    {currentVerb.category}
                  </Badge>
                </div>

                <div className="border-t pt-4">
                  <WordBreakdown
                    russianSentence={currentVerb.russian_sentence}
                    transliteration={currentVerb.sentence_transliteration}
                    englishSentence={currentVerb.english_sentence}
                  />
                </div>

                <div className="flex justify-center">
                  <AudioPlayer rank={currentVerb.rank} />
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentIdx > 0) {
                        setCurrentIdx(currentIdx - 1);
                      }
                    }}
                    disabled={currentIdx === 0}
                  >
                    Previous
                  </Button>
                  {currentIdx < sessionVerbs.length - 1 ? (
                    <Button onClick={() => setCurrentIdx(currentIdx + 1)}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={startRecall}>
                      Start Active Recall →
                    </Button>
                  )}
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  ← / H previous · → / L next · Enter to start recall
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Translate to Russian:
                  </p>
                  <div className="text-2xl font-semibold">
                    {currentVerb.english_verb}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    &quot;{currentVerb.english_sentence}&quot;
                  </p>
                </div>

                {showAnswer ? (
                  <>
                    <div className="border-t pt-4 text-center">
                      <div className="text-3xl font-bold mb-1">
                        {currentVerb.russian_verb}
                      </div>
                      <div className="text-muted-foreground">
                        {currentVerb.transliteration}
                      </div>
                      <p className="text-lg mt-3">
                        {currentVerb.russian_sentence}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentVerb.sentence_transliteration}
                      </p>
                      <div className="mt-3">
                        <AudioPlayer rank={currentVerb.rank} />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleAnswer("wrong")}
                      >
                        <span className="flex flex-col items-center">
                          <span>Wrong</span>
                          <span className="text-[10px] opacity-60">1</span>
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        onClick={() => handleAnswer("hard")}
                      >
                        <span className="flex flex-col items-center">
                          <span>Hard</span>
                          <span className="text-[10px] opacity-60">2</span>
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        className="border-green-200 text-green-600 hover:bg-green-50"
                        onClick={() => handleAnswer("good")}
                      >
                        <span className="flex flex-col items-center">
                          <span>Good</span>
                          <span className="text-[10px] opacity-60">3</span>
                        </span>
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAnswer("easy")}
                      >
                        <span className="flex flex-col items-center">
                          <span>Easy</span>
                          <span className="text-[10px] opacity-60">4</span>
                        </span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Try to say it aloud in Russian, then check
                    </p>
                    <Button onClick={() => setShowAnswer(true)} size="lg">
                      Show Answer
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">
                      Space / Enter to reveal · then 1-4 to grade
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMode("setup")}
        className="text-muted-foreground"
      >
        ← Back to setup
      </Button>
    </div>
  );
}
