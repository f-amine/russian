"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlaylistPlayer } from "@/components/audio-player";
import { loadSentences } from "@/lib/sentences";
import { updateTodayLog, getTodayLog } from "@/lib/progress";
import type { Sentence } from "@/lib/types";
import { ISLAND_LABELS, ISLANDS } from "@/lib/types";

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

  const islandOptions = [
    { value: "all", label: `All sentences (${sentences.length})` },
    ...ISLANDS.map((i) => ({
      value: i,
      label: `${ISLAND_LABELS[i] || i} (${sentences.filter((s) => s.island === i).length})`,
    })),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Listening & Shadowing</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Loop sentences. Repeat aloud as you hear them. Speed up as they become familiar.
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant={loop ? "default" : "outline"}
                      size="xs"
                      onClick={() => setLoop(!loop)}
                      title="Loop playlist"
                    >
                      Loop
                    </Button>
                    <Button
                      variant={shuffle ? "default" : "outline"}
                      size="xs"
                      onClick={() => setShuffle(!shuffle)}
                      title="Shuffle order"
                    >
                      Shuffle
                    </Button>
                    {loopCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Loops: {loopCount}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Loading sentences...
                </p>
              )}
            </CardContent>
          </Card>

          {current && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <Badge variant="outline">
                    {ISLAND_LABELS[current.island] || current.island}
                  </Badge>
                  <div>
                    <div className="text-xl font-bold">{current.russian}</div>
                    <div className="text-sm text-muted-foreground">
                      {current.transliteration}
                    </div>
                  </div>

                  {showTranslation && (
                    <div className="border-t pt-3">
                      <p className="text-base">{current.english}</p>
                      {current.notes && (
                        <p className="text-xs text-muted-foreground italic mt-2">
                          {current.notes}
                        </p>
                      )}
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
              <CardTitle className="text-sm">Island</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <select
                value={island}
                onChange={(e) => {
                  setIsland(e.target.value);
                  setCurrent(null);
                }}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              >
                {islandOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Shadow out loud:</strong> repeat each sentence
                immediately after you hear it.
              </p>
              <p>
                <strong>Speed up:</strong> once familiar, bump to 1.25x or 1.5x
                so real speech feels slow.
              </p>
              <p>
                <strong>Predict:</strong> after enough loops you should know the
                next sentence before it plays.
              </p>
              <p>
                <strong>Dead time:</strong> commute, dishes, gym warmup —
                listening time is free.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
