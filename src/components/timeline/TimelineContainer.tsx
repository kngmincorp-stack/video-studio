"use client";

import React, { useRef, useCallback, useMemo, useState } from "react";
import type { VideoBlueprint } from "@/types/schema";
import type { SceneLayoutItem, DragState, SelectedClip, ClipboardItem } from "@/types/timeline";
import { frameToPixel, pixelToFrame } from "@/lib/timeline-utils";
import { TimeRuler } from "./TimeRuler";
import { Playhead } from "./Playhead";
import { TrackLane } from "./TrackLane";
import { SceneClip } from "./SceneClip";
import { AudioClip } from "./AudioClip";
import { NarrationClip } from "./NarrationClip";
import { TransitionMarker } from "./TransitionMarker";
import { Slider } from "@/components/ui/slider";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuCheckboxItem,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";

type ContextTarget =
  | { type: "scene"; id: string }
  | { type: "audio"; id: string; parentSceneId: string; isGlobal: boolean }
  | { type: "narration"; sceneId: string }
  | { type: "empty" };

interface TimelineContainerProps {
  blueprint: VideoBlueprint;
  sceneLayout: SceneLayoutItem[];
  totalDurationFrames: number;
  zoomLevel: number;
  scrollLeft: number;
  playheadFrame: number;
  selectedSceneId: string | null;
  selectedClip: SelectedClip | null;
  clipboard: ClipboardItem | null;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (scrollLeft: number) => void;
  onSelectScene: (sceneId: string | null) => void;
  onSelectClip: (clip: SelectedClip | null) => void;
  onSeek: (frame: number) => void;
  onStartDrag: (dragState: DragState) => void;
  onDeleteScene: (sceneId: string) => void;
  onDuplicateScene: (sceneId: string) => void;
  onSplitScene: (sceneId: string, frame: number) => void;
  onAddScene: (afterSceneId: string | null) => void;
  onZoom: (zoomLevel: number) => void;
  // Clipboard
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  // Speed/Enable
  onChangeSpeed: (sceneId: string, factor: number) => void;
  onToggleEnabled: (sceneId: string) => void;
  onRippleDelete: (sceneId: string) => void;
  // Audio
  onChangeVolume: (sceneId: string, audioId: string, volume: number, isGlobal: boolean) => void;
  onToggleMute: (sceneId: string, audioId: string, isGlobal: boolean) => void;
  onDeleteAudio: (sceneId: string, audioId: string, isGlobal: boolean) => void;
  // Narration
  onChangeNarrationVolume: (sceneId: string, volume: number) => void;
  onEditNarrationText: (sceneId: string, text: string) => void;
  onDeleteNarration: (sceneId: string) => void;
}

export const TimelineContainer = React.memo(function TimelineContainer({
  blueprint,
  sceneLayout,
  totalDurationFrames,
  zoomLevel,
  scrollLeft,
  playheadFrame,
  selectedSceneId,
  selectedClip,
  clipboard,
  playheadRef,
  onScroll,
  onSelectScene,
  onSelectClip,
  onSeek,
  onStartDrag,
  onDeleteScene,
  onDuplicateScene,
  onSplitScene,
  onAddScene,
  onZoom,
  onCopy,
  onCut,
  onPaste,
  onChangeSpeed,
  onToggleEnabled,
  onRippleDelete,
  onChangeVolume,
  onToggleMute,
  onDeleteAudio,
  onChangeNarrationVolume,
  onEditNarrationText,
  onDeleteNarration,
}: TimelineContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [contextTarget, setContextTarget] = useState<ContextTarget>({ type: "empty" });
  const [editingNarrationSceneId, setEditingNarrationSceneId] = useState<string | null>(null);
  const [editingNarrationText, setEditingNarrationText] = useState("");

  const totalWidth = frameToPixel(totalDurationFrames, zoomLevel) + 100;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      onScroll(e.currentTarget.scrollLeft);
    },
    [onScroll]
  );

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

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleSceneContextMenu = useCallback((_e: React.MouseEvent, sceneId: string) => {
    setContextTarget({ type: "scene", id: sceneId });
  }, []);

  const handleAudioSelect = useCallback(
    (audioId: string, parentSceneId: string | undefined, isGlobal: boolean) => {
      onSelectClip({ type: "audio", id: audioId, parentSceneId: parentSceneId || undefined });
    },
    [onSelectClip]
  );

  const handleAudioContextMenu = useCallback(
    (_e: React.MouseEvent, audioId: string, parentSceneId: string | undefined, isGlobal: boolean) => {
      setContextTarget({ type: "audio", id: audioId, parentSceneId: parentSceneId || "", isGlobal });
      onSelectClip({ type: "audio", id: audioId, parentSceneId });
    },
    [onSelectClip]
  );

  const handleNarrationSelect = useCallback(
    (sceneId: string) => {
      onSelectClip({ type: "narration", id: sceneId, parentSceneId: sceneId });
    },
    [onSelectClip]
  );

  const handleNarrationContextMenu = useCallback(
    (_e: React.MouseEvent, sceneId: string) => {
      setContextTarget({ type: "narration", sceneId });
      onSelectClip({ type: "narration", id: sceneId, parentSceneId: sceneId });
    },
    [onSelectClip]
  );

  const handleEmptyContextMenu = useCallback(() => {
    setContextTarget({ type: "empty" });
  }, []);

  // Audio track clips
  const audioClips = useMemo(() => {
    const clips: React.ReactNode[] = [];
    blueprint.globalAudio.forEach((audio) => {
      clips.push(
        <AudioClip
          key={`global-${audio.id}`}
          audio={audio}
          startFrame={audio.startFrom}
          durationFrames={totalDurationFrames}
          zoomLevel={zoomLevel}
          isGlobal
          isSelected={selectedClip?.type === "audio" && selectedClip.id === audio.id}
          onSelect={handleAudioSelect}
          onContextMenu={handleAudioContextMenu}
        />
      );
    });
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
            isSelected={selectedClip?.type === "audio" && selectedClip.id === audio.id}
            parentSceneId={layout.sceneId}
            onSelect={handleAudioSelect}
            onContextMenu={handleAudioContextMenu}
          />
        );
      });
    });
    return clips;
  }, [blueprint, sceneLayout, totalDurationFrames, zoomLevel, selectedClip, handleAudioSelect, handleAudioContextMenu]);

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
            sceneId={layout.sceneId}
            isSelected={selectedClip?.type === "narration" && selectedClip.id === layout.sceneId}
            onSelect={handleNarrationSelect}
            onContextMenu={handleNarrationContextMenu}
          />
        );
      })
      .filter(Boolean);
  }, [blueprint.scenes, sceneLayout, zoomLevel, selectedClip, handleNarrationSelect, handleNarrationContextMenu]);

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

  // Helper to get audio volume for context menu
  const getAudioVolume = useCallback(
    (audioId: string, parentSceneId: string, isGlobal: boolean): number => {
      if (isGlobal) {
        return (blueprint.globalAudio.find((a) => a.id === audioId)?.volume ?? 1) * 100;
      }
      const scene = blueprint.scenes.find((s) => s.id === parentSceneId);
      return (scene?.audio.find((a) => a.id === audioId)?.volume ?? 1) * 100;
    },
    [blueprint]
  );

  const getNarrationVolume = useCallback(
    (sceneId: string): number => {
      const scene = blueprint.scenes.find((s) => s.id === sceneId);
      return (scene?.narration?.volumeScale ?? 1) * 100;
    },
    [blueprint.scenes]
  );

  // Render context menu content based on target
  const renderContextMenuContent = () => {
    switch (contextTarget.type) {
      case "scene": {
        const scene = blueprint.scenes.find((s) => s.id === contextTarget.id);
        const isEnabled = scene?.enabled ?? true;
        return (
          <>
            <ContextMenuItem onClick={onCopy}>
              コピー <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onCut}>
              切り取り <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
            </ContextMenuItem>
            {clipboard?.type === "scene" && (
              <ContextMenuItem onClick={onPaste}>
                貼り付け <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onDuplicateScene(contextTarget.id)}>
              複製 <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => {
              const layout = sceneLayout.find((l) => l.sceneId === contextTarget.id);
              if (layout) {
                const relativeFrame = playheadFrame - layout.startFrame;
                if (relativeFrame > 0 && relativeFrame < layout.durationFrames) {
                  onSplitScene(contextTarget.id, relativeFrame);
                } else {
                  onSplitScene(contextTarget.id, Math.floor(layout.durationFrames / 2));
                }
              }
            }}>
              再生位置で分割
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onAddScene(contextTarget.id)}>
              後ろにシーン追加
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>速度</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {[0.5, 1.0, 1.5, 2.0].map((speed) => (
                  <ContextMenuItem key={speed} onClick={() => onChangeSpeed(contextTarget.id, speed)}>
                    {speed}x
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuCheckboxItem
              checked={isEnabled}
              onCheckedChange={() => onToggleEnabled(contextTarget.id)}
            >
              有効
            </ContextMenuCheckboxItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={() => onDeleteScene(contextTarget.id)}>
              削除 <ContextMenuShortcut>Delete</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem variant="destructive" onClick={() => onRippleDelete(contextTarget.id)}>
              リップル削除
            </ContextMenuItem>
          </>
        );
      }

      case "audio": {
        const vol = getAudioVolume(contextTarget.id, contextTarget.parentSceneId, contextTarget.isGlobal);
        const isMuted = vol === 0;
        return (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>音量</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48 p-3" onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">{Math.round(vol)}%</span>
                  <Slider
                    value={[vol]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={([v]) => {
                      onChangeVolume(contextTarget.parentSceneId, contextTarget.id, v / 100, contextTarget.isGlobal);
                    }}
                  />
                </div>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem onClick={() => onToggleMute(contextTarget.parentSceneId, contextTarget.id, contextTarget.isGlobal)}>
              {isMuted ? "ミュート解除" : "ミュート"}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={() => onDeleteAudio(contextTarget.parentSceneId, contextTarget.id, contextTarget.isGlobal)}>
              削除
            </ContextMenuItem>
          </>
        );
      }

      case "narration": {
        const vol = getNarrationVolume(contextTarget.sceneId);
        const scene = blueprint.scenes.find((s) => s.id === contextTarget.sceneId);
        return (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>音量</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48 p-3" onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">{Math.round(vol)}%</span>
                  <Slider
                    value={[vol]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={([v]) => {
                      onChangeNarrationVolume(contextTarget.sceneId, v / 100);
                    }}
                  />
                </div>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem onClick={() => {
              if (scene?.narration) {
                setEditingNarrationSceneId(contextTarget.sceneId);
                setEditingNarrationText(scene.narration.text);
              }
            }}>
              テキスト編集
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={() => onDeleteNarration(contextTarget.sceneId)}>
              削除
            </ContextMenuItem>
          </>
        );
      }

      case "empty":
        return (
          <>
            <ContextMenuItem onClick={() => onAddScene(null)}>
              シーン追加
            </ContextMenuItem>
            {clipboard?.type === "scene" && (
              <ContextMenuItem onClick={onPaste}>
                貼り付け <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
              </ContextMenuItem>
            )}
          </>
        );
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={(node) => { containerRef(node); }}
            className="flex-1 overflow-x-auto overflow-y-hidden"
            onScroll={handleScroll}
            onWheel={handleWheel}
            onContextMenu={handleEmptyContextMenu}
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
                      onContextMenu={handleSceneContextMenu}
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
          {renderContextMenuContent()}
        </ContextMenuContent>
      </ContextMenu>

      {/* Narration text edit dialog */}
      {editingNarrationSceneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingNarrationSceneId(null)}>
          <div className="bg-popover border rounded-lg p-4 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium mb-2">ナレーションテキスト編集</h3>
            <textarea
              className="w-full h-32 rounded border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={editingNarrationText}
              onChange={(e) => setEditingNarrationText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                className="px-3 py-1.5 text-sm rounded border hover:bg-muted"
                onClick={() => setEditingNarrationSceneId(null)}
              >
                キャンセル
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  onEditNarrationText(editingNarrationSceneId, editingNarrationText);
                  setEditingNarrationSceneId(null);
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
