"use client";

import React from "react";
import { frameToPixel } from "@/lib/timeline-utils";
import type { AudioElement } from "@/types/schema";

interface AudioClipProps {
  audio: AudioElement;
  /** Start frame within the total timeline */
  startFrame: number;
  /** Duration in frames for this audio clip display */
  durationFrames: number;
  zoomLevel: number;
  isGlobal?: boolean;
}

export const AudioClip = React.memo(function AudioClip({
  audio,
  startFrame,
  durationFrames,
  zoomLevel,
  isGlobal,
}: AudioClipProps) {
  const left = frameToPixel(startFrame, zoomLevel);
  const width = frameToPixel(durationFrames, zoomLevel);

  return (
    <div
      className={`absolute top-1 bottom-1 flex items-center overflow-hidden rounded border text-[10px] select-none ${
        isGlobal
          ? "bg-teal-600/60 border-teal-400/60"
          : "bg-cyan-600/60 border-cyan-400/60"
      }`}
      style={{ left, width: Math.max(width, 4) }}
    >
      {width > 20 && (
        <span className="truncate px-1.5 text-white/80">
          {isGlobal ? "BGM" : "SFX"}
        </span>
      )}
    </div>
  );
});
