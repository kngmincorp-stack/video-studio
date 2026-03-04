"use client";

import { useReducer, useMemo, useCallback } from "react";
import type { VideoBlueprint } from "@/types/schema";
import type { TimelineState, TimelineAction, DragState, SceneLayoutItem } from "@/types/timeline";
import { computeSceneLayout, recalcTotalDuration, reorderScenes, trimScene, deleteScene, duplicateScene, splitScene, addScene } from "@/lib/timeline-utils";

const initialState: TimelineState = {
  zoomLevel: 2,
  scrollLeft: 0,
  selectedSceneId: null,
  playheadFrame: 0,
  isPlaying: false,
  dragState: null,
};

function timelineReducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case "SET_ZOOM":
      return { ...state, zoomLevel: Math.max(0.5, Math.min(10, action.zoomLevel)) };
    case "SET_SCROLL":
      return { ...state, scrollLeft: Math.max(0, action.scrollLeft) };
    case "SELECT_SCENE":
      return { ...state, selectedSceneId: action.sceneId };
    case "SET_PLAYHEAD":
      return { ...state, playheadFrame: Math.max(0, action.frame) };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.isPlaying };
    case "START_DRAG":
      return { ...state, dragState: action.dragState };
    case "UPDATE_DRAG":
      if (!state.dragState) return state;
      return { ...state, dragState: { ...state.dragState, currentX: action.currentX } };
    case "END_DRAG":
      return { ...state, dragState: null };
    default:
      return state;
  }
}

interface UseTimelineOptions {
  blueprint: VideoBlueprint;
  setBlueprint: (next: VideoBlueprint | ((prev: VideoBlueprint) => VideoBlueprint)) => void;
}

export function useTimeline({ blueprint, setBlueprint }: UseTimelineOptions) {
  const [state, dispatch] = useReducer(timelineReducer, initialState);

  const sceneLayout = useMemo<SceneLayoutItem[]>(
    () => computeSceneLayout(blueprint.scenes),
    [blueprint.scenes]
  );

  const totalDurationFrames = useMemo(
    () => blueprint.scenes.reduce((sum, s) => sum + s.durationFrames, 0),
    [blueprint.scenes]
  );

  // ─── Dispatch wrappers ───

  const setZoom = useCallback((zoomLevel: number) => {
    dispatch({ type: "SET_ZOOM", zoomLevel });
  }, []);

  const setScroll = useCallback((scrollLeft: number) => {
    dispatch({ type: "SET_SCROLL", scrollLeft });
  }, []);

  const selectScene = useCallback((sceneId: string | null) => {
    dispatch({ type: "SELECT_SCENE", sceneId });
  }, []);

  const setPlayhead = useCallback((frame: number) => {
    dispatch({ type: "SET_PLAYHEAD", frame });
  }, []);

  const setPlaying = useCallback((isPlaying: boolean) => {
    dispatch({ type: "SET_PLAYING", isPlaying });
  }, []);

  const startDrag = useCallback((dragState: DragState) => {
    dispatch({ type: "START_DRAG", dragState });
  }, []);

  const updateDrag = useCallback((currentX: number) => {
    dispatch({ type: "UPDATE_DRAG", currentX });
  }, []);

  const endDrag = useCallback(() => {
    dispatch({ type: "END_DRAG" });
  }, []);

  // ─── Scene operations (update blueprint via setBlueprint) ───

  const handleReorderScenes = useCallback(
    (fromIndex: number, toIndex: number) => {
      setBlueprint((prev) => recalcTotalDuration({
        ...prev,
        scenes: reorderScenes(prev.scenes, fromIndex, toIndex),
      }));
    },
    [setBlueprint]
  );

  const handleTrimScene = useCallback(
    (sceneId: string, newDurationFrames: number) => {
      setBlueprint((prev) => recalcTotalDuration({
        ...prev,
        scenes: trimScene(prev.scenes, sceneId, newDurationFrames),
      }));
    },
    [setBlueprint]
  );

  const handleDeleteScene = useCallback(
    (sceneId: string) => {
      setBlueprint((prev) => {
        const newScenes = deleteScene(prev.scenes, sceneId);
        if (newScenes === prev.scenes) return prev;
        return recalcTotalDuration({ ...prev, scenes: newScenes });
      });
      // Clear selection if deleted
      dispatch({ type: "SELECT_SCENE", sceneId: null });
    },
    [setBlueprint]
  );

  const handleDuplicateScene = useCallback(
    (sceneId: string) => {
      setBlueprint((prev) => recalcTotalDuration({
        ...prev,
        scenes: duplicateScene(prev.scenes, sceneId),
      }));
    },
    [setBlueprint]
  );

  const handleSplitScene = useCallback(
    (sceneId: string, splitAtFrame: number) => {
      setBlueprint((prev) => recalcTotalDuration({
        ...prev,
        scenes: splitScene(prev.scenes, sceneId, splitAtFrame),
      }));
    },
    [setBlueprint]
  );

  const handleAddScene = useCallback(
    (afterSceneId: string | null) => {
      setBlueprint((prev) => recalcTotalDuration({
        ...prev,
        scenes: addScene(prev.scenes, afterSceneId, prev.fps),
      }));
    },
    [setBlueprint]
  );

  return {
    state,
    dispatch,
    sceneLayout,
    totalDurationFrames,
    // Dispatch wrappers
    setZoom,
    setScroll,
    selectScene,
    setPlayhead,
    setPlaying,
    startDrag,
    updateDrag,
    endDrag,
    // Scene operations
    handleReorderScenes,
    handleTrimScene,
    handleDeleteScene,
    handleDuplicateScene,
    handleSplitScene,
    handleAddScene,
  };
}
