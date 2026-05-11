import type { Sentence } from "./types";

let cache: Sentence[] | null = null;

export async function loadSentences(): Promise<Sentence[]> {
  if (cache) return cache;

  const res = await fetch("/sentences.csv");
  const text = await res.text();
  const lines = text.trim().split("\n");

  const sentences: Sentence[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i]);
    if (parsed.length >= 5) {
      sentences.push({
        id: parseInt(parsed[0], 10),
        russian: parsed[1],
        transliteration: parsed[2],
        english: parsed[3],
        island: parsed[4],
        notes: parsed[5] || undefined,
      });
    }
  }

  cache = sentences;
  return sentences;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
