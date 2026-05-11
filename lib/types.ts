export interface Sentence {
  id: number;
  russian: string;
  transliteration: string;
  english: string;
  island: string;
  notes?: string;
}

export interface SentenceProgress {
  id: number;
  status: "new" | "learning" | "reviewing" | "mastered";
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string | null;
  nextReview: string | null;
}

export interface DailyLog {
  date: string;
  sentencesStudied: number;
  newSentencesLearned: number;
  recallCorrect: number;
  recallIncorrect: number;
  listeningMinutes: number;
  shadowingMinutes: number;
  islandsTouched: number;
}

export interface StudySession {
  sentences: Sentence[];
  currentIndex: number;
  mode: "learn" | "recall";
  results: { id: number; correct: boolean }[];
}

export const ISLANDS = [
  "greetings_basics",
  "self_intro",
  "numbers_time",
  "family",
  "work_dev",
  "food_restaurant",
  "cooking_morocco",
  "gym",
  "gaming_lol",
  "travel_basics",
  "shopping",
  "dating_questions",
  "dating_self",
  "dating_romance",
  "dating_future",
  "small_talk",
  "opinions_feelings",
  "needs_help",
  "health_body",
  "culture_morocco",
  "polite_refusals",
  "phone_messaging",
] as const;

export type Island = (typeof ISLANDS)[number];

export const ISLAND_LABELS: Record<string, string> = {
  greetings_basics: "Greetings & Basics",
  self_intro: "Self Intro",
  numbers_time: "Numbers & Time",
  family: "Family",
  work_dev: "Work / Dev",
  food_restaurant: "Food & Restaurant",
  cooking_morocco: "Cooking (Moroccan)",
  gym: "Gym",
  gaming_lol: "Gaming / LoL",
  travel_basics: "Travel Basics",
  shopping: "Shopping",
  dating_questions: "Dating — Questions",
  dating_self: "Dating — About Me",
  dating_romance: "Dating — Romance",
  dating_future: "Dating — Future",
  small_talk: "Small Talk",
  opinions_feelings: "Opinions & Feelings",
  needs_help: "Needs Help",
  health_body: "Health & Body",
  culture_morocco: "Morocco / Culture",
  polite_refusals: "Polite Refusals",
  phone_messaging: "Phone & Messaging",
};
