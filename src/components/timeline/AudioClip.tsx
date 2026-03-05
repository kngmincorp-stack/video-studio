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
  isSelected?: boolean;
  parentSceneId?: string;
  onSelect?: (audioId: string, parentSceneId: string | undefined, isGlobal: boolean) => void;
  onContextMenu?: (e: React.MouseEvent, audioId: string, parentSceneId: string | undefined, isGlobal: boolean) => void;
}

export const AudioClip = React.memo(function AudioClip({
  audio,
  startFrame,
  durationFrames,
  zoomLevel,
  isGlobal,
  isSelected,
  parentSceneId,
  onSelect,
  onContextMenu,
}: AudioClipProps) {
  const left = frameToPixel(startFrame, zoomLevel);
  const width = frameToPixel(durationFrames, zoomLevel);

  return (
    <div
      className={`absolute top-1 bottom-1 flex items-center overflow-hidden rounded border text-[10px] select-none cursor-pointer ${
        isGlobal
          ? "bg-teal-600/60 border-teal-400/60"
          : "bg-cyan-600/60 border-cyan-400/60"
      } ${isSelected ? "ring-2 ring-white/80" : ""}`}
      style={{ left, width: Math.max(width, 4) }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(audio.id, parentSceneId, !!isGlobal);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu?.(e, audio.id, parentSceneId, !!isGlobal);
      }}
    >
      {width > 20 && (
        <span className="truncate px-1.5 text-white/80">
          {isGlobal ? "BGM" : "SFX"} {audio.volume === 0 ? "(mute)" : ""}
        </span>
      )}
    </div>
  );
});
