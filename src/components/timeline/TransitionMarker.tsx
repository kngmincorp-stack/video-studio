"use client";

import React from "react";
import { frameToPixel } from "@/lib/timeline-utils";
import type { TransitionType } from "@/types/schema";

interface TransitionMarkerProps {
  frame: number;
  zoomLevel: number;
  transitionType: TransitionType;
}

export const TransitionMarker = React.memo(function TransitionMarker({
  frame,
  zoomLevel,
  transitionType,
}: TransitionMarkerProps) {
  if (transitionType === "none") return null;

  const left = frameToPixel(frame, zoomLevel);

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
      style={{ left }}
      title={`トランジション: ${transitionType}`}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" className="fill-yellow-400/80">
        <polygon points="5,0 10,5 5,10 0,5" />
      </svg>
    </div>
  );
});
