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

type Mode = "setup" | "learn" | "recall" | "results";

export default function StudyPage() {
  const [allVerbs, setAllVerbs] = useState<Verb[]>([]);
  const [mode, setMode] = useState<Mode>("setup");
  const [sessionVerbs, setSessionVerbs] = useState<Verb[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<{ rank: number; correct: boolean }[]>(
    []
  );
  const [batchSize, setBatchSize] = useState(30);
  const [startRank, setStartRank] = useState(1);
  const [studyType, setStudyType] = useState<"new" | "review" | "custom">(
    "new"
  );

  useEffect(() => {
    loadVerbs().then(setAllVerbs);
  }, []);

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
    setCurrentIdx(0);
    setShowAnswer(false);
    setResults([]);
    setMode("recall");
  };

  const handleAnswer = (correct: boolean) => {
    const verb = sessionVerbs[currentIdx];
    updateVerbProgress(verb.rank, correct);

    const newResults = [...results, { rank: verb.rank, correct }];
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

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => {
                const verb = sessionVerbs.find((v) => v.rank === r.rank);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                  >
                    <span>
                      {verb?.russian_verb}{" "}
                      <span className="text-muted-foreground">
                        — {verb?.english_verb}
                      </span>
                    </span>
                    <Badge variant={r.correct ? "default" : "destructive"}>
                      {r.correct ? "Correct" : "Wrong"}
                    </Badge>
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
          <Button
            onClick={() => {
              setCurrentIdx(0);
              setShowAnswer(false);
              setResults([]);
              setMode("recall");
            }}
          >
            Retry These Verbs
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
                  <p className="text-lg">{currentVerb.russian_sentence}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentVerb.sentence_transliteration}
                  </p>
                  <p className="text-sm mt-1">
                    {currentVerb.english_sentence}
                  </p>
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

                    <div className="flex gap-2 justify-center pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleAnswer(false)}
                      >
                        Got it Wrong
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleAnswer(true)}
                      >
                        Got it Right
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
