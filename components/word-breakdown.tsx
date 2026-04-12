"use client";

import { useEffect, useState } from "react";

type Glossary = Record<string, string>;

let glossaryCache: Glossary | null = null;
let glossaryPromise: Promise<Glossary> | null = null;

function loadGlossary(): Promise<Glossary> {
  if (glossaryCache) return Promise.resolve(glossaryCache);
  if (glossaryPromise) return glossaryPromise;
  glossaryPromise = fetch("/word-glossary.json")
    .then((r) => r.json())
    .then((data: Glossary) => {
      glossaryCache = data;
      return data;
    });
  return glossaryPromise;
}

function tokenize(sentence: string): string[] {
  // Split keeping punctuation attached to words for display,
  // but we'll strip it for lookup
  return sentence.split(/\s+/).filter(Boolean);
}

function stripPunctuation(word: string): string {
  return word.replace(/[^а-яёА-ЯЁa-zA-Z-]/g, "");
}

function alignWords(
  ruWords: string[],
  trWords: string[]
): { ru: string; tr: string }[] {
  const result: { ru: string; tr: string }[] = [];
  const maxLen = Math.max(ruWords.length, trWords.length);
  for (let i = 0; i < maxLen; i++) {
    result.push({
      ru: ruWords[i] || "",
      tr: trWords[i] || "",
    });
  }
  return result;
}

export function WordBreakdown({
  russianSentence,
  transliteration,
  englishSentence,
}: {
  russianSentence: string;
  transliteration: string;
  englishSentence: string;
}) {
  const [glossary, setGlossary] = useState<Glossary | null>(glossaryCache);

  useEffect(() => {
    if (!glossary) {
      loadGlossary().then(setGlossary);
    }
  }, [glossary]);

  const ruWords = tokenize(russianSentence);
  const trWords = tokenize(transliteration);
  const aligned = alignWords(ruWords, trWords);

  return (
    <div className="space-y-3">
      {/* Interlinear word-by-word display */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {aligned.map((pair, i) => {
          const cleaned = stripPunctuation(pair.ru).toLowerCase();
          const meaning = glossary?.[cleaned];
          return (
            <div key={i} className="flex flex-col items-center text-center min-w-0">
              <span className="text-base font-semibold">{pair.ru}</span>
              <span className="text-xs text-muted-foreground">{pair.tr}</span>
              {meaning ? (
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 max-w-20 leading-tight">
                  {meaning}
                </span>
              ) : cleaned ? (
                <span className="text-xs text-muted-foreground/50 mt-0.5">—</span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Full English translation below */}
      <p className="text-sm text-muted-foreground text-center border-t pt-2">
        {englishSentence}
      </p>
    </div>
  );
}
