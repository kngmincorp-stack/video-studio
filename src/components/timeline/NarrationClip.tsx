"use client";

import React from "react";
import { frameToPixel } from "@/lib/timeline-utils";

interface NarrationClipProps {
  startFrame: number;
  durationFrames: number;
  text: string;
  zoomLevel: number;
}

export const NarrationClip = React.memo(function NarrationClip({
  startFrame,
  durationFrames,
  text,
  zoomLevel,
}: NarrationClipProps) {
  const left = frameToPixel(startFrame, zoomLevel);
  const width = frameToPixel(durationFrames, zoomLevel);

  return (
    <div
      className="absolute top-1 bottom-1 flex items-center overflow-hidden rounded border bg-green-600/60 border-green-400/60 text-[10px] select-none"
      style={{ left, width: Math.max(width, 4) }}
    >
      {width > 30 && (
        <span className="truncate px-1.5 text-white/80">
          {text.slice(0, 20)}{text.length > 20 ? "…" : ""}
        </span>
      )}
    </div>
  );
});
