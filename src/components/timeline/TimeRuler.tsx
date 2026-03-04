"use client";

import React, { useCallback } from "react";
import { frameToPixel, pixelToFrame } from "@/lib/timeline-utils";

interface TimeRulerProps {
  totalDurationFrames: number;
  fps: number;
  zoomLevel: number;
  scrollLeft: number;
  containerWidth: number;
  onSeek: (frame: number) => void;
}

export const TimeRuler = React.memo(function TimeRuler({
  totalDurationFrames,
  fps,
  zoomLevel,
  scrollLeft,
  containerWidth,
  onSeek,
}: TimeRulerProps) {
  const totalWidth = frameToPixel(totalDurationFrames, zoomLevel);

  // Calculate tick interval based on zoom level
  const secondsPerTick = zoomLevel <= 1 ? 1 : zoomLevel <= 3 ? 2 : zoomLevel <= 6 ? 5 : 10;
  const framesPerTick = secondsPerTick * fps;
  const pixelsPerTick = frameToPixel(framesPerTick, zoomLevel);

  // Visible range
  const startFrame = pixelToFrame(scrollLeft, zoomLevel);
  const endFrame = pixelToFrame(scrollLeft + containerWidth, zoomLevel);

  // Generate ticks within visible range (plus some buffer)
  const firstTick = Math.floor(startFrame / framesPerTick) * framesPerTick;
  const ticks: { frame: number; px: number; label: string }[] = [];
  for (let f = firstTick; f <= Math.min(endFrame + framesPerTick, totalDurationFrames); f += framesPerTick) {
    const seconds = f / fps;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    ticks.push({
      frame: f,
      px: frameToPixel(f, zoomLevel),
      label: minutes > 0 ? `${minutes}:${String(secs).padStart(2, "0")}` : `${secs}s`,
    });
  }

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const frame = pixelToFrame(x, zoomLevel);
      onSeek(Math.max(0, Math.min(totalDurationFrames, frame)));
    },
    [scrollLeft, zoomLevel, totalDurationFrames, onSeek]
  );

  return (
    <div
      className="relative h-6 cursor-pointer border-b border-border bg-muted/30 select-none"
      style={{ width: totalWidth }}
      onClick={handleClick}
    >
      {ticks.map((tick) => (
        <div
          key={tick.frame}
          className="absolute top-0 h-full"
          style={{ left: tick.px }}
        >
          <div className="h-2.5 w-px bg-muted-foreground/40" />
          <span className="absolute top-2.5 -translate-x-1/2 text-[9px] text-muted-foreground/60 tabular-nums">
            {tick.label}
          </span>
        </div>
      ))}
    </div>
  );
});
