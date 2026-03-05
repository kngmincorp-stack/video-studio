"use client";

import React from "react";
import { frameToPixel } from "@/lib/timeline-utils";

interface NarrationClipProps {
  startFrame: number;
  durationFrames: number;
  text: string;
  zoomLevel: number;
  sceneId: string;
  isSelected?: boolean;
  onSelect?: (sceneId: string) => void;
  onContextMenu?: (e: React.MouseEvent, sceneId: string) => void;
}

export const NarrationClip = React.memo(function NarrationClip({
  startFrame,
  durationFrames,
  text,
  zoomLevel,
  sceneId,
  isSelected,
  onSelect,
  onContextMenu,
}: NarrationClipProps) {
  const left = frameToPixel(startFrame, zoomLevel);
  const width = frameToPixel(durationFrames, zoomLevel);

  return (
    <div
      className={`absolute top-1 bottom-1 flex items-center overflow-hidden rounded border bg-green-600/60 border-green-400/60 text-[10px] select-none cursor-pointer ${
        isSelected ? "ring-2 ring-white/80" : ""
      }`}
      style={{ left, width: Math.max(width, 4) }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(sceneId);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu?.(e, sceneId);
      }}
    >
      {width > 30 && (
        <span className="truncate px-1.5 text-white/80">
          {text.slice(0, 20)}{text.length > 20 ? "\u2026" : ""}
        </span>
      )}
    </div>
  );
});
