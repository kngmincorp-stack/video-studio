"use client";

import { useEffect } from "react";

interface UseTimelineKeyboardOptions {
  togglePlay: () => void;
  shuttle: (direction: "backward" | "stop" | "forward") => void;
  seekTo: (frame: number) => void;
  playheadFrame: number;
  totalDurationFrames: number;
  selectedSceneId: string | null;
  handleDeleteScene: (sceneId: string) => void;
  handleDuplicateScene: (sceneId: string) => void;
  setZoom: (zoomLevel: number) => void;
  zoomLevel: number;
  /** Set to false to disable shortcuts (e.g., when chat input is focused) */
  enabled?: boolean;
}

export function useTimelineKeyboard({
  togglePlay,
  shuttle,
  seekTo,
  playheadFrame,
  totalDurationFrames,
  selectedSceneId,
  handleDeleteScene,
  handleDuplicateScene,
  setZoom,
  zoomLevel,
  enabled = true,
}: UseTimelineKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;

        case "KeyJ":
          e.preventDefault();
          shuttle("backward");
          break;

        case "KeyK":
          e.preventDefault();
          shuttle("stop");
          break;

        case "KeyL":
          e.preventDefault();
          shuttle("forward");
          break;

        case "Delete":
        case "Backspace":
          if (selectedSceneId) {
            e.preventDefault();
            handleDeleteScene(selectedSceneId);
          }
          break;

        case "KeyD":
          if ((e.ctrlKey || e.metaKey) && selectedSceneId) {
            e.preventDefault();
            handleDuplicateScene(selectedSceneId);
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          seekTo(Math.max(0, playheadFrame - (e.shiftKey ? 10 : 1)));
          break;

        case "ArrowRight":
          e.preventDefault();
          seekTo(Math.min(totalDurationFrames, playheadFrame + (e.shiftKey ? 10 : 1)));
          break;

        case "Home":
          e.preventDefault();
          seekTo(0);
          break;

        case "End":
          e.preventDefault();
          seekTo(totalDurationFrames);
          break;

        case "Equal":
        case "NumpadAdd":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setZoom(zoomLevel / 1.5);
          }
          break;

        case "Minus":
        case "NumpadSubtract":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setZoom(zoomLevel * 1.5);
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    enabled,
    togglePlay,
    shuttle,
    seekTo,
    playheadFrame,
    totalDurationFrames,
    selectedSceneId,
    handleDeleteScene,
    handleDuplicateScene,
    setZoom,
    zoomLevel,
  ]);
}
