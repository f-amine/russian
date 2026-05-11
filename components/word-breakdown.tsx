"use client";

function tokenize(sentence: string): string[] {
  return sentence.split(/\s+/).filter(Boolean);
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
  const ruWords = tokenize(russianSentence);
  const trWords = tokenize(transliteration);
  const aligned = alignWords(ruWords, trWords);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {aligned.map((pair, i) => (
          <div key={i} className="flex flex-col items-center text-center min-w-0">
            <span className="text-base font-semibold">{pair.ru}</span>
            <span className="text-xs text-muted-foreground">{pair.tr}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center border-t pt-2">
        {englishSentence}
      </p>
    </div>
  );
}
