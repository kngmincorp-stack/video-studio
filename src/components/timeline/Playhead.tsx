"use client";

import React, { useCallback } from "react";
import { frameToPixel, pixelToFrame } from "@/lib/timeline-utils";
import type { DragState } from "@/types/timeline";

interface PlayheadProps {
  playheadFrame: number;
  totalDurationFrames: number;
  zoomLevel: number;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  onStartDrag: (dragState: DragState) => void;
  onSeek: (frame: number) => void;
}

export const Playhead = React.memo(function Playhead({
  playheadFrame,
  totalDurationFrames,
  zoomLevel,
  playheadRef,
  onStartDrag,
  onSeek,
}: PlayheadProps) {
  const px = frameToPixel(playheadFrame, zoomLevel);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onStartDrag({
        type: "playhead",
        startX: e.clientX,
        startFrame: playheadFrame,
        currentX: e.clientX,
      });
    },
    [playheadFrame, onStartDrag]
  );

  return (
    <div
      ref={playheadRef}
      className="pointer-events-none absolute top-0 z-30 h-full"
      style={{ transform: `translateX(${px}px)` }}
    >
      {/* Head triangle */}
      <div
        className="pointer-events-auto absolute -top-0 -translate-x-1/2 cursor-col-resize"
        onPointerDown={handlePointerDown}
      >
        <svg width="12" height="10" viewBox="0 0 12 10" className="fill-red-500">
          <polygon points="0,0 12,0 6,10" />
        </svg>
      </div>
      {/* Line */}
      <div className="absolute top-0 left-0 -translate-x-px h-full w-0.5 bg-red-500" />
    </div>
  );
});
