"use client";

import { useState, useCallback, useRef } from "react";
import type { VideoBlueprint, Format } from "@/types/schema";
import { createEmptyBlueprint, FORMAT_PRESETS } from "@/types/schema";

const MAX_UNDO_STACK = 50;

export function useVideoProject() {
  const [blueprint, setBlueprintState] = useState<VideoBlueprint>(() =>
    createEmptyBlueprint("short-9x16")
  );
  const undoStack = useRef<VideoBlueprint[]>([]);
  const redoStack = useRef<VideoBlueprint[]>([]);

  const setBlueprint = useCallback(
    (next: VideoBlueprint | ((prev: VideoBlueprint) => VideoBlueprint)) => {
      setBlueprintState((prev) => {
        undoStack.current.push(structuredClone(prev));
        if (undoStack.current.length > MAX_UNDO_STACK) {
          undoStack.current.shift();
        }
        redoStack.current = [];
        const newVal = typeof next === "function" ? next(prev) : next;
        return newVal;
      });
    },
    []
  );

  const undo = useCallback(() => {
    setBlueprintState((prev) => {
      const last = undoStack.current.pop();
      if (!last) return prev;
      redoStack.current.push(structuredClone(prev));
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setBlueprintState((prev) => {
      const next = redoStack.current.pop();
      if (!next) return prev;
      undoStack.current.push(structuredClone(prev));
      return next;
    });
  }, []);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  const changeFormat = useCallback(
    (format: Format) => {
      setBlueprint((prev) => {
        const preset = FORMAT_PRESETS[format];
        return {
          ...prev,
          format,
          width: preset.width,
          height: preset.height,
        };
      });
    },
    [setBlueprint]
  );

  return {
    blueprint,
    setBlueprint,
    undo,
    redo,
    canUndo,
    canRedo,
    changeFormat,
  };
}
