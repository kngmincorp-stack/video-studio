"use client";

import { useEffect, useCallback, useRef } from "react";
import type { PlayerRef } from "@remotion/player";

interface UsePlayerSyncOptions {
  playerRef: React.RefObject<PlayerRef | null>;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  setPlayhead: (frame: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  zoomLevel: number;
}

export function usePlayerSync({
  playerRef,
  playheadRef,
  setPlayhead,
  setPlaying,
  zoomLevel,
}: UsePlayerSyncOptions) {
  const shuttleSpeed = useRef(0); // -4, -2, -1, 0, 1, 2, 4
  const lastUpdateRef = useRef(0);

  // Sync player frame updates to playhead position (DOM direct for perf)
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handler = () => {
      const frame = player.getCurrentFrame();
      const now = Date.now();

      // Update DOM directly for smooth playhead movement
      if (playheadRef.current) {
        const px = frame / zoomLevel;
        playheadRef.current.style.transform = `translateX(${px}px)`;
      }

      // Throttle React state update to ~10Hz
      if (now - lastUpdateRef.current > 100) {
        lastUpdateRef.current = now;
        setPlayhead(frame);
      }
    };

    player.addEventListener("frameupdate", handler);
    player.addEventListener("play", () => setPlaying(true));
    player.addEventListener("pause", () => setPlaying(false));

    return () => {
      player.removeEventListener("frameupdate", handler);
    };
  }, [playerRef, playheadRef, setPlayhead, setPlaying, zoomLevel]);

  const seekTo = useCallback(
    (frame: number) => {
      const player = playerRef.current;
      if (!player) return;
      player.seekTo(frame);
      setPlayhead(frame);
    },
    [playerRef, setPlayhead]
  );

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
    } else {
      player.play();
    }
  }, [playerRef]);

  const stop = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.pause();
    player.seekTo(0);
    setPlayhead(0);
  }, [playerRef, setPlayhead]);

  // J/K/L shuttle control
  const shuttle = useCallback(
    (direction: "backward" | "stop" | "forward") => {
      const player = playerRef.current;
      if (!player) return;

      if (direction === "stop") {
        shuttleSpeed.current = 0;
        player.pause();
        return;
      }

      if (direction === "forward") {
        if (shuttleSpeed.current <= 0) shuttleSpeed.current = 1;
        else if (shuttleSpeed.current < 4) shuttleSpeed.current *= 2;
      } else {
        if (shuttleSpeed.current >= 0) shuttleSpeed.current = -1;
        else if (shuttleSpeed.current > -4) shuttleSpeed.current *= 2;
      }

      // Remotion Player doesn't have setPlaybackRate, so we simulate by stepping frames
      // For simplicity, just play forward at 1x for now
      if (shuttleSpeed.current > 0) {
        player.play();
      } else if (shuttleSpeed.current < 0) {
        // Step backward manually
        player.pause();
        const current = player.getCurrentFrame();
        player.seekTo(Math.max(0, current - Math.abs(shuttleSpeed.current) * 5));
      }
    },
    [playerRef]
  );

  return {
    seekTo,
    togglePlay,
    stop,
    shuttle,
  };
}
