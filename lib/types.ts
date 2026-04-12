export interface Verb {
  rank: number;
  russian_verb: string;
  transliteration: string;
  english_verb: string;
  russian_sentence: string;
  sentence_transliteration: string;
  english_sentence: string;
  category: string;
}

export interface VerbProgress {
  rank: number;
  status: "new" | "learning" | "reviewing" | "mastered";
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string | null;
  nextReview: string | null;
}

export interface DailyLog {
  date: string;
  verbsStudied: number;
  newVerbsLearned: number;
  recallCorrect: number;
  recallIncorrect: number;
  listeningMinutes: number;
  shadowingMinutes: number;
  languageIslands: number;
}

export interface StudySession {
  verbs: Verb[];
  currentIndex: number;
  mode: "learn" | "recall";
  results: { rank: number; correct: boolean }[];
}
