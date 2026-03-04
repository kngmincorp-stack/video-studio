"use client";

import React, { useCallback } from "react";
import { frameToPixel } from "@/lib/timeline-utils";
import { getSceneColor } from "@/lib/timeline-utils";
import type { SceneLayoutItem, DragState } from "@/types/timeline";

interface SceneClipProps {
  layout: SceneLayoutItem;
  zoomLevel: number;
  isSelected: boolean;
  onSelect: (sceneId: string) => void;
  onStartDrag: (dragState: DragState) => void;
  onContextMenu: (e: React.MouseEvent, sceneId: string) => void;
}

export const SceneClip = React.memo(function SceneClip({
  layout,
  zoomLevel,
  isSelected,
  onSelect,
  onStartDrag,
  onContextMenu,
}: SceneClipProps) {
  const left = frameToPixel(layout.startFrame, zoomLevel);
  const width = frameToPixel(layout.durationFrames, zoomLevel);
  const colorClass = getSceneColor(layout.type);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      onSelect(layout.sceneId);

      // Check if clicking on trim handle
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const trimZone = 6; // px

      if (relX < trimZone) {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onStartDrag({
          type: "trim-start",
          sceneId: layout.sceneId,
          startX: e.clientX,
          startFrame: layout.durationFrames,
          currentX: e.clientX,
        });
      } else if (relX > rect.width - trimZone) {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onStartDrag({
          type: "trim-end",
          sceneId: layout.sceneId,
          startX: e.clientX,
          startFrame: layout.durationFrames,
          currentX: e.clientX,
        });
      } else {
        // Move drag — start after small movement threshold
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onStartDrag({
          type: "move",
          sceneId: layout.sceneId,
          startX: e.clientX,
          startFrame: layout.startFrame,
          currentX: e.clientX,
        });
      }
    },
    [layout, onSelect, onStartDrag]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onSelect(layout.sceneId);
      onContextMenu(e, layout.sceneId);
    },
    [layout.sceneId, onSelect, onContextMenu]
  );

  return (
    <div
      className={`absolute top-1 bottom-1 flex items-center overflow-hidden rounded border text-[10px] text-white select-none ${colorClass} ${
        isSelected ? "ring-2 ring-white/80 ring-offset-1 ring-offset-background" : ""
      }`}
      style={{ left, width: Math.max(width, 4) }}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      {/* Left trim handle */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/30" />

      {/* Content */}
      {width > 30 && (
        <div className="truncate px-2 font-medium">
          {layout.title}
        </div>
      )}

      {/* Right trim handle */}
      <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/30" />
    </div>
  );
});
