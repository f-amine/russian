"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";

function audioSrc(id: number) {
  return `/audio/${String(id).padStart(4, "0")}.mp3`;
}

export function AudioPlayer({ id }: { id: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idRef = useRef(id);
  const [playing, setPlaying] = useState(false);
  const [missing, setMissing] = useState(false);

  const play = useCallback(() => {
    const src = audioSrc(id);
    if (!audioRef.current || idRef.current !== id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => {
        setPlaying(false);
        setMissing(true);
      };
      idRef.current = id;
      setMissing(false);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      setMissing(true);
      setPlaying(false);
    });
    setPlaying(true);
  }, [id]);

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={play}
      disabled={playing}
      title={missing ? "No audio for this sentence yet" : "Play audio"}
      className={missing ? "opacity-30" : ""}
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
  ids,
  speed = 1,
  loop = false,
  shuffle = false,
  onTrackChange,
  onLoopComplete,
}: {
  ids: number[];
  speed?: number;
  loop?: boolean;
  shuffle?: boolean;
  onTrackChange?: (id: number, index: number) => void;
  onLoopComplete?: (count: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const idxRef = useRef(0);
  const idsRef = useRef(ids);
  const loopRef = useRef(loop);
  const shuffleRef = useRef(shuffle);
  const loopCountRef = useRef(0);
  const speedRef = useRef(speed);
  const onTrackChangeRef = useRef(onTrackChange);
  const onLoopCompleteRef = useRef(onLoopComplete);
  const playTrackRef = useRef<(idx: number) => void>(() => {});

  useEffect(() => {
    idsRef.current = ids;
    loopRef.current = loop;
    shuffleRef.current = shuffle;
    speedRef.current = speed;
    onTrackChangeRef.current = onTrackChange;
    onLoopCompleteRef.current = onLoopComplete;
  });

  const playTrack = useCallback((idx: number) => {
    if (idx >= idsRef.current.length) {
      if (loopRef.current) {
        loopCountRef.current++;
        onLoopCompleteRef.current?.(loopCountRef.current);
        if (shuffleRef.current) {
          for (let i = idsRef.current.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [idsRef.current[i], idsRef.current[j]] = [idsRef.current[j], idsRef.current[i]];
          }
        }
        const nextIdx = 0;
        idxRef.current = nextIdx;
        setCurrentIdx(nextIdx);
        setTimeout(() => playTrackRef.current(nextIdx), 500);
        return;
      }
      setPlaying(false);
      return;
    }
    const id = idsRef.current[idx];
    const src = audioSrc(id);

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(src);
    audio.playbackRate = speedRef.current;
    const advance = () => {
      const next = idxRef.current + 1;
      idxRef.current = next;
      setCurrentIdx(next);
      playTrackRef.current(next);
    };
    audio.onended = advance;
    audio.onerror = advance;
    audioRef.current = audio;
    audio.play().catch(advance);
    setCurrentIdx(idx);
    onTrackChangeRef.current?.(id, idx);
  }, []);

  useEffect(() => {
    playTrackRef.current = playTrack;
  }, [playTrack]);

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
    if (n < idsRef.current.length) {
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
        {currentIdx + 1} / {ids.length} &middot; {speed}x
        {loop && " · loop"}
      </span>
    </div>
  );
}
