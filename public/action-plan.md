# Russian — Sentence-First Plan

You're 6 days in. Trip in 3–6 months. Goal: real conversations with a Russian girlfriend, ordering food, getting around. Not textbook fluency.

## The 3 Steps

### 1. Language Islands
Sentences you'd actually say in your life, grouped by topic. Not random vocabulary. Your islands are seeded already — Greetings, Self Intro, Family, Work, Food, Cooking (Moroccan), Gym, Gaming, Travel, Shopping, Dating (Questions / About Me / Romance / Future), Small Talk, Opinions, Help, Health, Morocco, Polite Refusals, Phone.

Add your own sentences as they come up. Open `public/sentences.csv` and append: `id,russian,transliteration,english,island,notes`.

### 2. Audio Flood + Shadowing
Listen on repeat. Repeat out loud at the same time. Train ear and mouth together.

- Morning routine, commute, gym warmup, dishes — listen.
- Speed up to 1.25x or 1.5x once familiar.
- Goal: predict the next sentence before it plays.

Audio is generated locally with **edge-tts** (free, no API key, uses Microsoft Edge's voice service). Russian voice: `ru-RU-DmitryNeural` (male).

```bash
pnpm audio:setup   # one-time: create venv + install edge-tts
pnpm audio:gen     # generate MP3s for any sentences missing audio
```

After adding new sentences to `public/sentences.csv`, run `pnpm audio:gen` to fill in the new audio. Override voice with `node scripts/generate-audio.mjs --voice ru-RU-SvetlanaNeural` (female).

### 3. Active Recall
The hard part. The part that makes you fluent.

- English shows. You say the Russian out loud, from memory.
- Reveal answer. Grade yourself 1–4.
- Struggle is the point. Frustration = learning.
- 10–15 minutes a day, every day.

## Daily Routine (~40 min focused + dead-time listening)

| Time | What |
|------|------|
| Morning (10 min) | Listen + shadow while getting ready |
| Commute | Listen passively |
| Lunch break (10 min) | Active recall |
| After work (20 min) | Study new island / review due |
| Before bed (10 min) | Active recall — sticks during sleep |

## Weekly Rhythm

- **Week 1–2**: Greetings, Self Intro, Numbers, Polite Refusals, Needs Help. Survival.
- **Week 3–4**: Food, Travel Basics, Shopping, Small Talk. Tourist functional.
- **Week 5–6**: Dating Questions, About Me, Family, Work. Social.
- **Week 7+**: Romance, Future, Culture, Gym/Cooking/Gaming. Personal flavor.

## Rules

- **No grammar books.** Grammar comes from sentence patterns. If a rule jumps out, fine — but never sit down to study tables.
- **Speak out loud.** Whisper at work, mumble in the car, full volume at home. Mouth needs reps.
- **Mistakes are fine.** Russians won't care. The person who corrects your accent has their own problems.
- **Add sentences from your life.** Caught yourself saying something today? Translate it and put it in.

## When You're In Russia

- Use `ты` with women your age, friends, kids. Use `вы` with anyone older, in shops, taxis, formal.
- Halal food: ask "Здесь есть халяльная еда?" — many places will accommodate.
- Saying "Я не пью" (I don't drink) is fully normal. Don't explain unless asked.

## Pre-Input Comprehension (bonus technique)

Before watching any Russian video, grab the transcript. Study the new words first. Then watch. Comprehension jumps from 10% to 80%+. Now native content actually teaches you.
