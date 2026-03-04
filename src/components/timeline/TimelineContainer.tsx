"use client";

import React, { useRef, useCallback, useMemo, useState } from "react";
import type { VideoBlueprint } from "@/types/schema";
import type { SceneLayoutItem, DragState } from "@/types/timeline";
import { frameToPixel, pixelToFrame } from "@/lib/timeline-utils";
import { TimeRuler } from "./TimeRuler";
import { Playhead } from "./Playhead";
import { TrackLane } from "./TrackLane";
import { SceneClip } from "./SceneClip";
import { AudioClip } from "./AudioClip";
import { NarrationClip } from "./NarrationClip";
import { TransitionMarker } from "./TransitionMarker";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface TimelineContainerProps {
  blueprint: VideoBlueprint;
  sceneLayout: SceneLayoutItem[];
  totalDurationFrames: number;
  zoomLevel: number;
  scrollLeft: number;
  playheadFrame: number;
  selectedSceneId: string | null;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (scrollLeft: number) => void;
  onSelectScene: (sceneId: string | null) => void;
  onSeek: (frame: number) => void;
  onStartDrag: (dragState: DragState) => void;
  onDeleteScene: (sceneId: string) => void;
  onDuplicateScene: (sceneId: string) => void;
  onSplitScene: (sceneId: string, frame: number) => void;
  onAddScene: (afterSceneId: string | null) => void;
  onZoom: (zoomLevel: number) => void;
}

export const TimelineContainer = React.memo(function TimelineContainer({
  blueprint,
  sceneLayout,
  totalDurationFrames,
  zoomLevel,
  scrollLeft,
  playheadFrame,
  selectedSceneId,
  playheadRef,
  onScroll,
  onSelectScene,
  onSeek,
  onStartDrag,
  onDeleteScene,
  onDuplicateScene,
  onSplitScene,
  onAddScene,
  onZoom,
}: TimelineContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [contextMenuSceneId, setContextMenuSceneId] = useState<string | null>(null);

  const totalWidth = frameToPixel(totalDurationFrames, zoomLevel) + 100; // extra padding

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      onScroll(e.currentTarget.scrollLeft);
    },
    [onScroll]
  );

  // Ctrl+Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1.2 : 1 / 1.2;
        onZoom(zoomLevel * delta);
      }
    },
    [zoomLevel, onZoom]
  );

  // Measure container width
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleContextMenu = useCallback((_e: React.MouseEvent, sceneId: string) => {
    setContextMenuSceneId(sceneId);
  }, []);

  // Audio track clips
  const audioClips = useMemo(() => {
    const clips: React.ReactNode[] = [];
    // Global audio
    blueprint.globalAudio.forEach((audio) => {
      clips.push(
        <AudioClip
          key={`global-${audio.id}`}
          audio={audio}
          startFrame={audio.startFrom}
          durationFrames={totalDurationFrames}
          zoomLevel={zoomLevel}
          isGlobal
        />
      );
    });
    // Per-scene audio
    sceneLayout.forEach((layout) => {
      const scene = blueprint.scenes.find((s) => s.id === layout.sceneId);
      scene?.audio.forEach((audio) => {
        clips.push(
          <AudioClip
            key={`scene-${audio.id}`}
            audio={audio}
            startFrame={layout.startFrame + audio.startFrom}
            durationFrames={layout.durationFrames}
            zoomLevel={zoomLevel}
          />
        );
      });
    });
    return clips;
  }, [blueprint, sceneLayout, totalDurationFrames, zoomLevel]);

  // Narration clips
  const narrationClips = useMemo(() => {
    return sceneLayout
      .map((layout) => {
        const scene = blueprint.scenes.find((s) => s.id === layout.sceneId);
        if (!scene?.narration) return null;
        return (
          <NarrationClip
            key={`narr-${layout.sceneId}`}
            startFrame={layout.startFrame}
            durationFrames={scene.narration.audioDurationFrames || layout.durationFrames}
            text={scene.narration.text}
            zoomLevel={zoomLevel}
          />
        );
      })
      .filter(Boolean);
  }, [blueprint.scenes, sceneLayout, zoomLevel]);

  // Transition markers
  const transitionMarkers = useMemo(() => {
    return sceneLayout.slice(0, -1).map((layout, i) => {
      const scene = blueprint.scenes[i];
      if (!scene?.transition || scene.transition.type === "none") return null;
      return (
        <TransitionMarker
          key={`trans-${layout.sceneId}`}
          frame={layout.endFrame}
          zoomLevel={zoomLevel}
          transitionType={scene.transition.type}
        />
      );
    });
  }, [blueprint.scenes, sceneLayout, zoomLevel]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={(node) => { containerRef(node); }}
          className="flex-1 overflow-x-auto overflow-y-hidden"
          onScroll={handleScroll}
          onWheel={handleWheel}
        >
          <div className="relative min-w-full" style={{ width: totalWidth }}>
            {/* Time Ruler */}
            <TimeRuler
              totalDurationFrames={totalDurationFrames}
              fps={blueprint.fps}
              zoomLevel={zoomLevel}
              scrollLeft={scrollLeft}
              containerWidth={containerWidth}
              onSeek={onSeek}
            />

            {/* Tracks area with playhead overlay */}
            <div className="relative">
              {/* Playhead (spans all tracks) */}
              <Playhead
                playheadFrame={playheadFrame}
                totalDurationFrames={totalDurationFrames}
                zoomLevel={zoomLevel}
                playheadRef={playheadRef}
                onStartDrag={onStartDrag}
                onSeek={onSeek}
              />

              {/* Video Track */}
              <TrackLane label="映像" icon="🎬" totalWidth={totalWidth}>
                {sceneLayout.map((layout) => (
                  <SceneClip
                    key={layout.sceneId}
                    layout={layout}
                    zoomLevel={zoomLevel}
                    isSelected={selectedSceneId === layout.sceneId}
                    onSelect={onSelectScene}
                    onStartDrag={onStartDrag}
                    onContextMenu={handleContextMenu}
                  />
                ))}
                {transitionMarkers}
              </TrackLane>

              {/* Audio Track */}
              <TrackLane label="音声" icon="🔊" totalWidth={totalWidth}>
                {audioClips}
              </TrackLane>

              {/* Narration Track */}
              <TrackLane label="ナレ" icon="🗣" totalWidth={totalWidth}>
                {narrationClips}
              </TrackLane>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {contextMenuSceneId && (
          <>
            <ContextMenuItem onClick={() => onDuplicateScene(contextMenuSceneId)}>
              複製 (Ctrl+D)
            </ContextMenuItem>
            <ContextMenuItem onClick={() => {
              const layout = sceneLayout.find(l => l.sceneId === contextMenuSceneId);
              if (layout) {
                const mid = Math.floor(layout.durationFrames / 2);
                onSplitScene(contextMenuSceneId, mid);
              }
            }}>
              分割
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onAddScene(contextMenuSceneId)}>
              後ろにシーン追加
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-destructive"
              onClick={() => onDeleteScene(contextMenuSceneId)}
            >
              削除 (Delete)
            </ContextMenuItem>
          </>
        )}
        {!contextMenuSceneId && (
          <ContextMenuItem onClick={() => onAddScene(null)}>
            シーン追加
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});
