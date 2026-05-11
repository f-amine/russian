"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getStats, getTodayLog } from "@/lib/progress";
import { loadSentences } from "@/lib/sentences";
import type { DailyLog } from "@/lib/types";

export default function Dashboard() {
  const [stats, setStats] = useState({
    mastered: 0,
    reviewing: 0,
    learning: 0,
    totalStudied: 0,
    streak: 0,
    totalLogs: 0,
    logs: [] as DailyLog[],
  });
  const [today, setToday] = useState<DailyLog | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(getStats());
    setToday(getTodayLog());
    loadSentences().then((s) => setTotal(s.length));
  }, []);

  const overallPercent = total > 0 ? Math.round((stats.totalStudied / total) * 100) : 0;
  const masteredPercent = total > 0 ? Math.round((stats.mastered / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Russian Language Islands
        </h1>
        <p className="text-muted-foreground mt-1">
          Personalized sentences &middot; sentence-first method
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sentences Studied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudied}</div>
            <Progress value={overallPercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {overallPercent}% of {total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mastered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.mastered}
            </div>
            <Progress value={masteredPercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {masteredPercent}% mastered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.learning + stats.reviewing}
            </div>
            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
              <span>{stats.learning} learning</span>
              <span>&middot;</span>
              <span>{stats.reviewing} reviewing</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak} days</div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep it going!
            </p>
          </CardContent>
        </Card>
      </div>

      {today && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Today&apos;s Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Sentences Studied
                </div>
                <div className="text-xl font-semibold">
                  {today.sentencesStudied}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">New Learned</div>
                <div className="text-xl font-semibold">
                  {today.newSentencesLearned}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Recall Accuracy
                </div>
                <div className="text-xl font-semibold">
                  {today.recallCorrect + today.recallIncorrect > 0
                    ? Math.round(
                        (today.recallCorrect /
                          (today.recallCorrect + today.recallIncorrect)) *
                          100
                      )
                    : 0}
                  %
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Listening (min)
                </div>
                <div className="text-xl font-semibold">
                  {today.listeningMinutes}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="hover:ring-2 hover:ring-primary/20 transition-all">
          <CardHeader>
            <CardTitle>The 3-Step System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Language Islands</strong>
              <p className="text-muted-foreground">
                Full sentences from your real life, grouped by topic.
              </p>
            </div>
            <div>
              <strong>2. Audio Flood + Shadowing</strong>
              <p className="text-muted-foreground">
                Listen on repeat. Speak along out loud.
              </p>
            </div>
            <div>
              <strong>3. Active Recall</strong>
              <p className="text-muted-foreground">
                English → Russian aloud, from memory. The hard part.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:ring-2 hover:ring-primary/20 transition-all">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/study">Start Study Session</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/listen">Listen + Shadow</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/flashcards">Flashcards</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/browse">Browse Islands</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:ring-2 hover:ring-primary/20 transition-all">
          <CardHeader>
            <CardTitle>Key Principles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Sentences not words.</strong>{" "}
              Grammar is a side effect.
            </p>
            <p>
              <strong className="text-foreground">Your life, not textbook.</strong>{" "}
              Only learn what you&apos;d actually say.
            </p>
            <p>
              <strong className="text-foreground">Speak out loud daily.</strong>{" "}
              Mouth needs practice, not just ears.
            </p>
            <p>
              <strong className="text-foreground">Struggle is the point.</strong>{" "}
              Active recall &gt; passive review.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
