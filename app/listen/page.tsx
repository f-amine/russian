"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlaylistPlayer } from "@/components/audio-player";
import { loadVerbs } from "@/lib/verbs";
import { updateTodayLog, getTodayLog } from "@/lib/progress";
import type { Verb } from "@/lib/types";

export default function ListenPage() {
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [currentVerb, setCurrentVerb] = useState<Verb | null>(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const [listeningStarted, setListeningStarted] = useState<number | null>(null);

  useEffect(() => {
    loadVerbs().then(setVerbs);
  }, []);

  const rangeVerbs = verbs.filter(
    (v) => v.rank >= rangeStart && v.rank <= rangeEnd
  );
  const ranks = rangeVerbs.map((v) => v.rank);

  const onTrackChange = useCallback(
    (rank: number) => {
      const verb = verbs.find((v) => v.rank === rank);
      if (verb) setCurrentVerb(verb);

      if (!listeningStarted) {
        setListeningStarted(Date.now());
      }
    },
    [verbs, listeningStarted]
  );

  useEffect(() => {
    if (!listeningStarted) return;
    const interval = setInterval(() => {
      const minutes = Math.floor((Date.now() - listeningStarted) / 60000);
      if (minutes > 0) {
        const todayLog = getTodayLog();
        updateTodayLog({ listeningMinutes: Math.max(todayLog.listeningMinutes, minutes) });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [listeningStarted]);

  const presets = [
    { label: "1-100 (Top)", start: 1, end: 100 },
    { label: "1-200", start: 1, end: 200 },
    { label: "1-500", start: 1, end: 500 },
    { label: "1-1000", start: 1, end: 1000 },
    { label: "501-1000", start: 501, end: 1000 },
    { label: "1001-1500", start: 1001, end: 1500 },
    { label: "1501-2000", start: 1501, end: 2000 },
    { label: "All 2000", start: 1, end: 2000 },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Listening Practice</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Listen to sentences on repeat. Follow along while reading. Increase
        speed as they become familiar.
      </p>

      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Player</span>
                <div className="flex gap-1">
                  {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <Button
                      key={s}
                      variant={speed === s ? "default" : "outline"}
                      size="xs"
                      onClick={() => setSpeed(s)}
                    >
                      {s}x
                    </Button>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ranks.length > 0 ? (
                <div className="space-y-3">
                  <PlaylistPlayer
                    ranks={ranks}
                    speed={speed}
                    loop={loop}
                    shuffle={shuffle}
                    onTrackChange={onTrackChange}
                    onLoopComplete={(count) => setLoopCount(count)}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant={loop ? "default" : "outline"}
                      size="xs"
                      onClick={() => setLoop(!loop)}
                      title="Loop playlist"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 2l4 4-4 4" />
                        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                        <path d="M7 22l-4-4 4-4" />
                        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                      </svg>
                      Loop
                    </Button>
                    <Button
                      variant={shuffle ? "default" : "outline"}
                      size="xs"
                      onClick={() => setShuffle(!shuffle)}
                      title="Shuffle order"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 3h5v5" />
                        <path d="M4 20L21 3" />
                        <path d="M21 16v5h-5" />
                        <path d="M15 15l6 6" />
                        <path d="M4 4l5 5" />
                      </svg>
                      Shuffle
                    </Button>
                    {loopCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Loops completed: {loopCount}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Loading verbs...
                </p>
              )}
            </CardContent>
          </Card>

          {currentVerb && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      #{currentVerb.rank}
                    </span>
                    <div className="text-2xl font-bold">
                      {currentVerb.russian_verb}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentVerb.transliteration}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-lg">{currentVerb.russian_sentence}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentVerb.sentence_transliteration}
                    </p>
                  </div>

                  {showTranslation && (
                    <div className="border-t pt-3">
                      <p className="font-medium">{currentVerb.english_verb}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentVerb.english_sentence}
                      </p>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTranslation(!showTranslation)}
                  >
                    {showTranslation ? "Hide" : "Show"} Translation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  variant={
                    rangeStart === p.start && rangeEnd === p.end
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setRangeStart(p.start);
                    setRangeEnd(p.end);
                    setCurrentVerb(null);
                  }}
                >
                  {p.label}
                  <Badge variant="secondary" className="ml-auto">
                    {p.end - p.start + 1}
                  </Badge>
                </Button>
              ))}

              <div className="border-t pt-2 mt-2">
                <label className="text-xs text-muted-foreground">Custom</label>
                <div className="flex gap-1 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={rangeStart}
                    onChange={(e) =>
                      setRangeStart(parseInt(e.target.value) || 1)
                    }
                    className="h-7 w-20 rounded border border-input bg-background px-2 text-xs"
                  />
                  <span className="self-center text-xs">to</span>
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={rangeEnd}
                    onChange={(e) =>
                      setRangeEnd(parseInt(e.target.value) || 2000)
                    }
                    className="h-7 w-20 rounded border border-input bg-background px-2 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Read + Listen:</strong> Follow the Russian text while
                the audio plays. Glance at the English before each sentence.
              </p>
              <p>
                <strong>Speed up:</strong> Once sentences are familiar, increase
                to 1.25x or 1.5x so real speech feels slower.
              </p>
              <p>
                <strong>Sandwich method:</strong> Alternate between this and
                real Russian podcasts every 5-20 minutes.
              </p>
              <p>
                <strong>Goal:</strong> Hear the full playlist multiple times per
                week.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
