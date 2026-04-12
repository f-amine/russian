"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getStats, getTodayLog } from "@/lib/progress";
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

  useEffect(() => {
    setStats(getStats());
    setToday(getTodayLog());
  }, []);

  const totalVerbs = 2000;
  const overallPercent = Math.round((stats.totalStudied / totalVerbs) * 100);
  const masteredPercent = Math.round((stats.mastered / totalVerbs) * 100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Russian Learning Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          2,000 verbs &middot; 12-month fluency plan
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verbs Studied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudied}</div>
            <Progress value={overallPercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {overallPercent}% of 2,000
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
                  Verbs Studied
                </div>
                <div className="text-xl font-semibold">
                  {today.verbsStudied}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">New Learned</div>
                <div className="text-xl font-semibold">
                  {today.newVerbsLearned}
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
            <CardTitle>Daily Routine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">1.</span>
              <span className="text-sm">
                <strong>15 min</strong> — New vocabulary with mnemonics
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">2.</span>
              <span className="text-sm">
                <strong>15 min</strong> — Read + listen to sentences
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">3.</span>
              <span className="text-sm">
                <strong>15 min</strong> — Active recall (EN → RU)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">4.</span>
              <span className="text-sm">
                <strong>5 min</strong> — Shadowing pronunciation
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">5.</span>
              <span className="text-sm">
                <strong>1-2 hr</strong> — Passive listening (during day)
              </span>
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
              <Link href="/listen">Listen to Sentences</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/verbs">Browse Verbs</Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/plan">View Full Plan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:ring-2 hover:ring-primary/20 transition-all">
          <CardHeader>
            <CardTitle>Key Principles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Vocabulary &gt; Grammar.</strong>{" "}
              3,000 words + no grammar beats 500 words + perfect grammar.
            </p>
            <p>
              <strong className="text-foreground">Mnemonics are mandatory.</strong>{" "}
              Russian has almost no English cognates.
            </p>
            <p>
              <strong className="text-foreground">Active recall.</strong>{" "}
              English → Russian aloud is the most effective exercise.
            </p>
            <p>
              <strong className="text-foreground">Listen every day.</strong>{" "}
              Repetition is the key to mastery.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
