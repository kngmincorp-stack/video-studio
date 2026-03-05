"use client";

import { useReducer, useMemo, useCallback } from "react";
import type { VideoBlueprint, Scene } from "@/types/schema";
import type { TimelineState, TimelineAction, DragState, SceneLayoutItem, SelectedClip, ClipboardItem } from "@/types/timeline";
import { computeSceneLayout, recalcTotalDuration, reorderScenes, trimScene, deleteScene, duplicateScene, splitScene, addScene, copyScene, pasteScene, changeSceneSpeed } from "@/lib/timeline-utils";

const initialState: TimelineState = {
  zoomLevel: 2,
  scrollLeft: 0,
  selectedClip: null,
  playheadFrame: 0,
  isPlaying: false,
  dragState: null,
  clipboard: null,
};

function timelineReducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case "SET_ZOOM":
      return { ...state, zoomLevel: Math.max(0.5, Math.min(10, action.zoomLevel)) };
    case "SET_SCROLL":
      return { ...state, scrollLeft: Math.max(0, action.scrollLeft) };
    case "SELECT_SCENE":
      return { ...state, selectedClip: action.sceneId ? { type: "scene", id: action.sceneId } : null };
    case "SELECT_CLIP":
      return { ...state, selectedClip: action.clip };
    case "SET_CLIPBOARD":
      return { ...state, clipboard: action.item };
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

  // Backward compat: selectedSceneId derived from selectedClip
  const selectedSceneId = state.selectedClip?.type === "scene" ? state.selectedClip.id : null;

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

  const selectClip = useCallback((clip: SelectedClip | null) => {
    dispatch({ type: "SELECT_CLIP", clip });
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
      dispatch({ type: "SELECT_CLIP", clip: null });
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

  // ─── Clipboard operations ───

  const copyClip = useCallback(() => {
    const clip = state.selectedClip;
    if (!clip) return;
    if (clip.type === "scene") {
      const scene = blueprint.scenes.find((s) => s.id === clip.id);
      if (scene) {
        dispatch({ type: "SET_CLIPBOARD", item: { type: "scene", data: structuredClone(scene) } });
      }
    }
  }, [state.selectedClip, blueprint.scenes]);

  const cutClip = useCallback(() => {
    const clip = state.selectedClip;
    if (!clip) return;
    if (clip.type === "scene") {
      const scene = blueprint.scenes.find((s) => s.id === clip.id);
      if (scene) {
        dispatch({ type: "SET_CLIPBOARD", item: { type: "scene", data: structuredClone(scene) } });
        handleDeleteScene(clip.id);
      }
    }
  }, [state.selectedClip, blueprint.scenes, handleDeleteScene]);

  const pasteClip = useCallback(() => {
    const cb = state.clipboard;
    if (!cb) return;
    if (cb.type === "scene") {
      setBlueprint((prev) => recalcTotalDuration({
        ...prev,
        scenes: pasteScene(prev.scenes, selectedSceneId, cb.data as Scene),
      }));
    }
  }, [state.clipboard, selectedSceneId, setBlueprint]);

  // ─── Audio/Narration operations ───

  const changeVolume = useCallback(
    (sceneId: string, audioId: string, volume: number, isGlobal: boolean) => {
      setBlueprint((prev) => {
        if (isGlobal) {
          return {
            ...prev,
            globalAudio: prev.globalAudio.map((a) =>
              a.id === audioId ? { ...a, volume } : a
            ),
          };
        }
        return {
          ...prev,
          scenes: prev.scenes.map((s) =>
            s.id === sceneId
              ? { ...s, audio: s.audio.map((a) => (a.id === audioId ? { ...a, volume } : a)) }
              : s
          ),
        };
      });
    },
    [setBlueprint]
  );

  const toggleMute = useCallback(
    (sceneId: string, audioId: string, isGlobal: boolean) => {
      setBlueprint((prev) => {
        if (isGlobal) {
          return {
            ...prev,
            globalAudio: prev.globalAudio.map((a) =>
              a.id === audioId ? { ...a, volume: a.volume > 0 ? 0 : 1 } : a
            ),
          };
        }
        return {
          ...prev,
          scenes: prev.scenes.map((s) =>
            s.id === sceneId
              ? { ...s, audio: s.audio.map((a) => (a.id === audioId ? { ...a, volume: a.volume > 0 ? 0 : 1 } : a)) }
              : s
          ),
        };
      });
    },
    [setBlueprint]
  );

  const deleteAudio = useCallback(
    (sceneId: string, audioId: string, isGlobal: boolean) => {
      setBlueprint((prev) => {
        if (isGlobal) {
          return { ...prev, globalAudio: prev.globalAudio.filter((a) => a.id !== audioId) };
        }
        return {
          ...prev,
          scenes: prev.scenes.map((s) =>
            s.id === sceneId ? { ...s, audio: s.audio.filter((a) => a.id !== audioId) } : s
          ),
        };
      });
      dispatch({ type: "SELECT_CLIP", clip: null });
    },
    [setBlueprint]
  );

  const changeNarrationVolume = useCallback(
    (sceneId: string, volume: number) => {
      setBlueprint((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) =>
          s.id === sceneId && s.narration
            ? { ...s, narration: { ...s.narration, volumeScale: volume } }
            : s
        ),
      }));
    },
    [setBlueprint]
  );

  const editNarrationText = useCallback(
    (sceneId: string, text: string) => {
      setBlueprint((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) =>
          s.id === sceneId && s.narration
            ? { ...s, narration: { ...s.narration, text } }
            : s
        ),
      }));
    },
    [setBlueprint]
  );

  const deleteNarration = useCallback(
    (sceneId: string) => {
      setBlueprint((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) =>
          s.id === sceneId ? { ...s, narration: undefined } : s
        ),
      }));
      dispatch({ type: "SELECT_CLIP", clip: null });
    },
    [setBlueprint]
  );

  const handleChangeSpeed = useCallback(
    (sceneId: string, factor: number) => {
      setBlueprint((prev) => recalcTotalDuration({
        ...prev,
        scenes: changeSceneSpeed(prev.scenes, sceneId, factor),
      }));
    },
    [setBlueprint]
  );

  const toggleEnabled = useCallback(
    (sceneId: string) => {
      setBlueprint((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) =>
          s.id === sceneId ? { ...s, enabled: !(s.enabled ?? true) } : s
        ),
      }));
    },
    [setBlueprint]
  );

  const rippleDelete = useCallback(
    (sceneId: string) => {
      handleDeleteScene(sceneId);
    },
    [handleDeleteScene]
  );

  return {
    state,
    dispatch,
    sceneLayout,
    totalDurationFrames,
    selectedSceneId,
    // Dispatch wrappers
    setZoom,
    setScroll,
    selectScene,
    selectClip,
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
    // Clipboard
    copyClip,
    cutClip,
    pasteClip,
    // Audio/Narration
    changeVolume,
    toggleMute,
    deleteAudio,
    changeNarrationVolume,
    editNarrationText,
    deleteNarration,
    // Speed/Enable
    handleChangeSpeed,
    toggleEnabled,
    rippleDelete,
  };
}
