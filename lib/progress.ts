import type { SentenceProgress, DailyLog } from "./types";

const PROGRESS_KEY = "russian-sentence-progress";
const DAILY_LOG_KEY = "russian-daily-log";

export function getProgress(): Record<number, SentenceProgress> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(PROGRESS_KEY);
  return stored ? JSON.parse(stored) : {};
}

export function saveProgress(progress: Record<number, SentenceProgress>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export type Confidence = "wrong" | "hard" | "good" | "easy";

export function updateSentenceProgress(
  id: number,
  correct: boolean,
  confidence?: Confidence
): SentenceProgress {
  const progress = getProgress();
  const existing = progress[id] || {
    id,
    status: "new" as const,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewed: null,
    nextReview: null,
  };

  const now = new Date().toISOString();

  if (correct) {
    existing.correctCount++;
  } else {
    existing.incorrectCount++;
  }

  existing.lastReviewed = now;

  const total = existing.correctCount + existing.incorrectCount;
  const accuracy = total > 0 ? existing.correctCount / total : 0;
  const grade = confidence || (correct ? "good" : "wrong");

  if (existing.correctCount >= 5 && accuracy >= 0.8) {
    existing.status = "mastered";
    existing.nextReview =
      grade === "easy" ? addDays(now, 14) :
      grade === "hard" ? addDays(now, 3) :
      addDays(now, 7);
  } else if (existing.correctCount >= 2 && accuracy >= 0.6) {
    existing.status = "reviewing";
    existing.nextReview =
      grade === "easy" ? addDays(now, 4) :
      grade === "hard" ? addDays(now, 1) :
      addDays(now, 2);
  } else if (total > 0) {
    existing.status = "learning";
    existing.nextReview =
      grade === "easy" ? addDays(now, 2) :
      addDays(now, 1);
  }

  progress[id] = existing;
  saveProgress(progress);
  return existing;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function getDailyLogs(): DailyLog[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(DAILY_LOG_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getTodayLog(): DailyLog {
  const logs = getDailyLogs();
  const today = new Date().toISOString().split("T")[0];
  return (
    logs.find((l) => l.date === today) || {
      date: today,
      sentencesStudied: 0,
      newSentencesLearned: 0,
      recallCorrect: 0,
      recallIncorrect: 0,
      listeningMinutes: 0,
      shadowingMinutes: 0,
      islandsTouched: 0,
    }
  );
}

export function updateTodayLog(updates: Partial<DailyLog>) {
  const logs = getDailyLogs();
  const today = new Date().toISOString().split("T")[0];
  const idx = logs.findIndex((l) => l.date === today);
  const current = getTodayLog();
  const updated = { ...current, ...updates };

  if (idx >= 0) {
    logs[idx] = updated;
  } else {
    logs.push(updated);
  }

  localStorage.setItem(DAILY_LOG_KEY, JSON.stringify(logs));
}

export function getStats() {
  const progress = getProgress();
  const entries = Object.values(progress);
  const logs = getDailyLogs();

  const mastered = entries.filter((e) => e.status === "mastered").length;
  const reviewing = entries.filter((e) => e.status === "reviewing").length;
  const learning = entries.filter((e) => e.status === "learning").length;
  const totalStudied = entries.length;

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    if (logs.find((l) => l.date === dateStr && l.sentencesStudied > 0)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    mastered,
    reviewing,
    learning,
    totalStudied,
    streak,
    totalLogs: logs.length,
    logs,
  };
}
