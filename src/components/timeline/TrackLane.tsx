"use client";

import React from "react";

interface TrackLaneProps {
  label: string;
  icon: string;
  children: React.ReactNode;
  totalWidth: number;
}

export const TrackLane = React.memo(function TrackLane({
  label,
  icon,
  children,
  totalWidth,
}: TrackLaneProps) {
  return (
    <div className="flex border-b border-border/50 last:border-b-0">
      {/* Track label (fixed) */}
      <div className="sticky left-0 z-20 flex w-10 shrink-0 items-center justify-center border-r border-border/50 bg-background/80 backdrop-blur-sm" title={label}>
        <span className="text-xs">{icon}</span>
      </div>
      {/* Track content (scrollable) */}
      <div className="relative h-10" style={{ width: totalWidth }}>
        {children}
      </div>
    </div>
  );
});
