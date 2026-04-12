import type { Verb } from "./types";

let verbsCache: Verb[] | null = null;

export async function loadVerbs(): Promise<Verb[]> {
  if (verbsCache) return verbsCache;

  const res = await fetch("/verbs.csv");
  const text = await res.text();
  const lines = text.trim().split("\n");

  // Skip header
  const verbs: Verb[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i]);
    if (parsed.length >= 8) {
      verbs.push({
        rank: parseInt(parsed[0], 10),
        russian_verb: parsed[1],
        transliteration: parsed[2],
        english_verb: parsed[3],
        russian_sentence: parsed[4],
        sentence_transliteration: parsed[5],
        english_sentence: parsed[6],
        category: parsed[7],
      });
    }
  }

  verbsCache = verbs;
  return verbs;
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
