"use client";

import React from "react";
import { Play, Pause, Square, ZoomIn, ZoomOut, Maximize2, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { frameToTimecode } from "@/lib/timeline-utils";

interface TimelineToolbarProps {
  isPlaying: boolean;
  playheadFrame: number;
  totalDurationFrames: number;
  fps: number;
  zoomLevel: number;
  onTogglePlay: () => void;
  onStop: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onAddScene: () => void;
  onToggleChat: () => void;
}

export const TimelineToolbar = React.memo(function TimelineToolbar({
  isPlaying,
  playheadFrame,
  totalDurationFrames,
  fps,
  zoomLevel,
  onTogglePlay,
  onStop,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onAddScene,
  onToggleChat,
}: TimelineToolbarProps) {
  return (
    <div className="flex h-9 items-center gap-1 border-b border-border bg-muted/50 px-2">
      {/* Playback controls */}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onTogglePlay} title={isPlaying ? "一時停止 (Space)" : "再生 (Space)"}>
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStop} title="停止">
        <Square className="h-3.5 w-3.5" />
      </Button>

      {/* Timecode */}
      <div className="mx-2 font-mono text-xs text-muted-foreground tabular-nums">
        {frameToTimecode(playheadFrame, fps)} / {frameToTimecode(totalDurationFrames, fps)}
      </div>

      <div className="flex-1" />

      {/* Zoom controls */}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomOut} title="ズームアウト (Ctrl+-)">
        <ZoomOut className="h-3.5 w-3.5" />
      </Button>
      <span className="w-10 text-center text-[10px] text-muted-foreground tabular-nums">
        {zoomLevel.toFixed(1)}x
      </span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomIn} title="ズームイン (Ctrl++)">
        <ZoomIn className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomFit} title="全体表示">
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>

      <div className="mx-1 h-4 w-px bg-border" />

      {/* Add scene */}
      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onAddScene}>
        <Plus className="h-3.5 w-3.5" />
        シーン追加
      </Button>

      {/* Chat toggle */}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleChat} title="チャット">
        <MessageSquare className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
});
