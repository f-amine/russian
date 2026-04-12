"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

export function AudioPlayer({ rank }: { rank: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rankRef = useRef(rank);
  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => {
    const src = `/audio/${String(rank).padStart(4, "0")}.mp3`;
    if (!audioRef.current || rankRef.current !== rank) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => setPlaying(false);
      rankRef.current = rank;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setPlaying(true);
  }, [rank]);

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={play}
      disabled={playing}
      title="Play audio"
    >
      {playing ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </Button>
  );
}

export function PlaylistPlayer({
  ranks,
  speed = 1,
  loop = false,
  shuffle = false,
  onTrackChange,
  onLoopComplete,
}: {
  ranks: number[];
  speed?: number;
  loop?: boolean;
  shuffle?: boolean;
  onTrackChange?: (rank: number, index: number) => void;
  onLoopComplete?: (count: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const idxRef = useRef(0);
  const ranksRef = useRef(ranks);
  const loopRef = useRef(loop);
  const shuffleRef = useRef(shuffle);
  const loopCountRef = useRef(0);
  ranksRef.current = ranks;
  loopRef.current = loop;
  shuffleRef.current = shuffle;

  const playTrack = useCallback(
    (idx: number) => {
      if (idx >= ranksRef.current.length) {
        if (loopRef.current) {
          loopCountRef.current++;
          onLoopComplete?.(loopCountRef.current);
          if (shuffleRef.current) {
            // Shuffle the ranks array in place for next loop
            for (let i = ranksRef.current.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [ranksRef.current[i], ranksRef.current[j]] = [ranksRef.current[j], ranksRef.current[i]];
            }
          }
          const nextIdx = 0;
          idxRef.current = nextIdx;
          setCurrentIdx(nextIdx);
          setTimeout(() => playTrack(nextIdx), 500);
          return;
        }
        setPlaying(false);
        return;
      }
      const rank = ranksRef.current[idx];
      const src = `/audio/${String(rank).padStart(4, "0")}.mp3`;

      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(src);
      audio.playbackRate = speed;
      audio.onended = () => {
        const next = idxRef.current + 1;
        idxRef.current = next;
        setCurrentIdx(next);
        playTrack(next);
      };
      audio.onerror = () => {
        const next = idxRef.current + 1;
        idxRef.current = next;
        setCurrentIdx(next);
        playTrack(next);
      };
      audioRef.current = audio;
      audio.play();
      setCurrentIdx(idx);
      onTrackChange?.(rank, idx);
    },
    [speed, onTrackChange]
  );

  const toggle = useCallback(() => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      setPlaying(true);
      playTrack(idxRef.current);
    }
  }, [playing, playTrack]);

  const next = useCallback(() => {
    const n = idxRef.current + 1;
    if (n < ranksRef.current.length) {
      idxRef.current = n;
      playTrack(n);
    }
  }, [playTrack]);

  const prev = useCallback(() => {
    const n = Math.max(0, idxRef.current - 1);
    idxRef.current = n;
    playTrack(n);
  }, [playTrack]);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon-sm" onClick={prev}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      </Button>
      <Button variant="outline" size="sm" onClick={toggle}>
        {playing ? (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            Pause
          </>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Play All
          </>
        )}
      </Button>
      <Button variant="outline" size="icon-sm" onClick={next}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 18h2V6h-2zM5.5 12l8.5-6v12z" />
        </svg>
      </Button>
      <span className="text-xs text-muted-foreground ml-2">
        {currentIdx + 1} / {ranks.length} &middot; {speed}x
        {loop && " &middot; loop"}
      </span>
    </div>
  );
}
