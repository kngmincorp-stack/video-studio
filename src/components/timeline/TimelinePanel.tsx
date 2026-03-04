"use client";

import React, { useRef, useCallback, useEffect } from "react";
import type { PlayerRef } from "@remotion/player";
import type { VideoBlueprint } from "@/types/schema";
import { useTimeline } from "@/hooks/useTimeline";
import { usePlayerSync } from "@/hooks/usePlayerSync";
import { useTimelineKeyboard } from "@/hooks/useTimelineKeyboard";
import { pixelToFrame, frameToPixel } from "@/lib/timeline-utils";
import { TimelineToolbar } from "./TimelineToolbar";
import { TimelineContainer } from "./TimelineContainer";

interface TimelinePanelProps {
  blueprint: VideoBlueprint;
  setBlueprint: (next: VideoBlueprint | ((prev: VideoBlueprint) => VideoBlueprint)) => void;
  playerRef: React.RefObject<PlayerRef | null>;
  onToggleChat: () => void;
}

export function TimelinePanel({
  blueprint,
  setBlueprint,
  playerRef,
  onToggleChat,
}: TimelinePanelProps) {
  const playheadRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    state,
    sceneLayout,
    totalDurationFrames,
    setZoom,
    setScroll,
    selectScene,
    setPlayhead,
    setPlaying,
    startDrag,
    updateDrag,
    endDrag,
    handleReorderScenes,
    handleTrimScene,
    handleDeleteScene,
    handleDuplicateScene,
    handleSplitScene,
    handleAddScene,
  } = useTimeline({ blueprint, setBlueprint });

  const { seekTo, togglePlay, stop, shuttle } = usePlayerSync({
    playerRef,
    playheadRef,
    setPlayhead,
    setPlaying,
    zoomLevel: state.zoomLevel,
  });

  useTimelineKeyboard({
    togglePlay,
    shuttle,
    seekTo,
    playheadFrame: state.playheadFrame,
    totalDurationFrames,
    selectedSceneId: state.selectedSceneId,
    handleDeleteScene,
    handleDuplicateScene,
    setZoom,
    zoomLevel: state.zoomLevel,
  });

  // ─── Drag handling (pointer move/up on document) ───
  useEffect(() => {
    if (!state.dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      updateDrag(e.clientX);

      const drag = state.dragState!;
      const deltaX = e.clientX - drag.startX;
      const deltaFrames = pixelToFrame(deltaX, state.zoomLevel);

      if (drag.type === "playhead") {
        const newFrame = Math.max(0, Math.min(totalDurationFrames, drag.startFrame + deltaFrames));
        seekTo(newFrame);
      }
      // Visual feedback for move/trim is handled via CSS transforms in SceneClip
    };

    const handlePointerUp = (e: PointerEvent) => {
      const drag = state.dragState!;
      const deltaX = e.clientX - drag.startX;
      const deltaFrames = pixelToFrame(deltaX, state.zoomLevel);

      if (drag.type === "trim-end" && drag.sceneId) {
        const newDuration = drag.startFrame + deltaFrames;
        handleTrimScene(drag.sceneId, newDuration);
      } else if (drag.type === "trim-start" && drag.sceneId) {
        const newDuration = drag.startFrame - deltaFrames;
        handleTrimScene(drag.sceneId, newDuration);
      } else if (drag.type === "move" && drag.sceneId) {
        // Calculate target position for reorder
        const threshold = 20; // px minimum movement to trigger reorder
        if (Math.abs(deltaX) > threshold) {
          const fromIndex = blueprint.scenes.findIndex((s) => s.id === drag.sceneId);
          if (fromIndex !== -1) {
            // Find target index based on movement direction
            const targetFrame = drag.startFrame + deltaFrames;
            let toIndex = fromIndex;
            for (let i = 0; i < sceneLayout.length; i++) {
              const mid = sceneLayout[i].startFrame + sceneLayout[i].durationFrames / 2;
              if (targetFrame < mid) {
                toIndex = i;
                break;
              }
              toIndex = i;
            }
            if (toIndex !== fromIndex) {
              handleReorderScenes(fromIndex, toIndex);
            }
          }
        }
      }

      endDrag();
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [state.dragState, state.zoomLevel, totalDurationFrames, sceneLayout, blueprint.scenes, seekTo, updateDrag, endDrag, handleTrimScene, handleReorderScenes]);

  // ─── Zoom handlers ───
  const handleZoomIn = useCallback(() => setZoom(state.zoomLevel / 1.5), [state.zoomLevel, setZoom]);
  const handleZoomOut = useCallback(() => setZoom(state.zoomLevel * 1.5), [state.zoomLevel, setZoom]);
  const handleZoomFit = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 40; // minus track label width
    const fitZoom = totalDurationFrames / containerWidth;
    setZoom(Math.max(0.5, Math.min(10, fitZoom)));
  }, [totalDurationFrames, setZoom]);

  return (
    <div ref={containerRef} className="flex h-full flex-col bg-background">
      <TimelineToolbar
        isPlaying={state.isPlaying}
        playheadFrame={state.playheadFrame}
        totalDurationFrames={totalDurationFrames}
        fps={blueprint.fps}
        zoomLevel={state.zoomLevel}
        onTogglePlay={togglePlay}
        onStop={stop}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        onAddScene={() => handleAddScene(state.selectedSceneId)}
        onToggleChat={onToggleChat}
      />
      <TimelineContainer
        blueprint={blueprint}
        sceneLayout={sceneLayout}
        totalDurationFrames={totalDurationFrames}
        zoomLevel={state.zoomLevel}
        scrollLeft={state.scrollLeft}
        playheadFrame={state.playheadFrame}
        selectedSceneId={state.selectedSceneId}
        playheadRef={playheadRef}
        onScroll={setScroll}
        onSelectScene={selectScene}
        onSeek={seekTo}
        onStartDrag={startDrag}
        onDeleteScene={handleDeleteScene}
        onDuplicateScene={handleDuplicateScene}
        onSplitScene={handleSplitScene}
        onAddScene={handleAddScene}
        onZoom={setZoom}
      />
    </div>
  );
}
