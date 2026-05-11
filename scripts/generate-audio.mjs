#!/usr/bin/env node
// Generate Russian TTS audio for every sentence in public/sentences.csv.
// Uses edge-tts (free, local — talks to Microsoft Edge's TTS service).
//
// Setup once:
//   python3 -m venv scripts/.venv
//   scripts/.venv/bin/pip install edge-tts
//
// Run:
//   node scripts/generate-audio.mjs                # missing only
//   node scripts/generate-audio.mjs --force        # regenerate all
//   node scripts/generate-audio.mjs --voice ru-RU-SvetlanaNeural
//   node scripts/generate-audio.mjs --id 42        # one sentence

import { readFile, mkdir, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV_PATH = join(ROOT, "public", "sentences.csv");
const AUDIO_DIR = join(ROOT, "public", "audio");
const EDGE_TTS_BIN = join(__dirname, ".venv", "bin", "edge-tts");

const args = process.argv.slice(2);
const force = args.includes("--force");
const voiceIdx = args.indexOf("--voice");
const voice = voiceIdx >= 0 ? args[voiceIdx + 1] : "ru-RU-DmitryNeural";
const idIdx = args.indexOf("--id");
const onlyId = idIdx >= 0 ? parseInt(args[idIdx + 1], 10) : null;
const concurrency = 4;

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        current += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

async function loadSentences() {
  const text = await readFile(CSV_PATH, "utf8");
  const lines = text.trim().split("\n");
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i]);
    if (parsed.length >= 5) {
      out.push({ id: parseInt(parsed[0], 10), russian: parsed[1] });
    }
  }
  return out;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function generate(text, outPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(EDGE_TTS_BIN, [
      "--voice", voice,
      "--text", text,
      "--write-media", outPath,
    ]);
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`edge-tts exited ${code}: ${stderr}`));
    });
    proc.on("error", reject);
  });
}

async function main() {
  await mkdir(AUDIO_DIR, { recursive: true });

  if (!(await exists(EDGE_TTS_BIN))) {
    console.error(`edge-tts not found at ${EDGE_TTS_BIN}`);
    console.error("Install once:");
    console.error("  python3 -m venv scripts/.venv");
    console.error("  scripts/.venv/bin/pip install edge-tts");
    process.exit(1);
  }

  const sentences = await loadSentences();
  const filtered = onlyId !== null ? sentences.filter((s) => s.id === onlyId) : sentences;

  const jobs = [];
  for (const s of filtered) {
    const file = join(AUDIO_DIR, `${String(s.id).padStart(4, "0")}.mp3`);
    if (!force && (await exists(file))) continue;
    jobs.push({ s, file });
  }

  console.log(`Voice: ${voice}`);
  console.log(`Total: ${filtered.length} · To generate: ${jobs.length} · Skipped: ${filtered.length - jobs.length}`);

  if (jobs.length === 0) return;

  let done = 0;
  let failed = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (jobs.length > 0) {
      const job = jobs.shift();
      if (!job) return;
      try {
        await generate(job.s.russian, job.file);
        done++;
        process.stdout.write(`\r${done}/${done + jobs.length + failed} generated...`);
      } catch (err) {
        failed++;
        console.error(`\n#${job.s.id} "${job.s.russian}" failed: ${err.message}`);
      }
    }
  });
  await Promise.all(workers);
  process.stdout.write("\n");
  console.log(`Done. Generated ${done}, failed ${failed}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
