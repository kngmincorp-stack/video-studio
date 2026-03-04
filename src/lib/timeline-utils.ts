import type { Scene, VideoBlueprint } from "@/types/schema";
import type { SceneLayoutItem } from "@/types/timeline";

// ─── Frame / Pixel / Timecode Conversions ───

/** Convert frame number to timecode string "MM:SS:FF" */
export function frameToTimecode(frame: number, fps: number): string {
  const totalSeconds = Math.floor(frame / fps);
  const remainingFrames = Math.floor(frame % fps);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(remainingFrames).padStart(2, "0")}`;
}

/** Convert frame to pixel position */
export function frameToPixel(frame: number, zoomLevel: number): number {
  return frame / zoomLevel;
}

/** Convert pixel position to frame */
export function pixelToFrame(pixel: number, zoomLevel: number): number {
  return Math.round(pixel * zoomLevel);
}

// ─── Scene Layout Computation ───

/** Compute layout positions for each scene (start/end frames) */
export function computeSceneLayout(scenes: Scene[]): SceneLayoutItem[] {
  let currentFrame = 0;
  return scenes.map((scene) => {
    const item: SceneLayoutItem = {
      sceneId: scene.id,
      startFrame: currentFrame,
      endFrame: currentFrame + scene.durationFrames,
      durationFrames: scene.durationFrames,
      type: scene.type,
      title: scene.title || scene.type,
    };
    currentFrame += scene.durationFrames;
    return item;
  });
}

/** Get color for scene type */
export function getSceneColor(type: string): string {
  switch (type) {
    case "title":
      return "bg-indigo-500/80 border-indigo-400";
    case "text":
      return "bg-blue-500/80 border-blue-400";
    case "narration":
      return "bg-violet-500/80 border-violet-400";
    case "image":
      return "bg-amber-500/80 border-amber-400";
    case "list":
      return "bg-emerald-500/80 border-emerald-400";
    case "comparison":
      return "bg-orange-500/80 border-orange-400";
    case "ending":
      return "bg-red-500/80 border-red-400";
    default:
      return "bg-slate-500/80 border-slate-400";
  }
}

/** Get hex color for scene type (for non-tailwind usage) */
export function getSceneHexColor(type: string): string {
  switch (type) {
    case "title":
      return "#6366f1";
    case "text":
      return "#3b82f6";
    case "narration":
      return "#8b5cf6";
    case "image":
      return "#f59e0b";
    case "list":
      return "#10b981";
    case "comparison":
      return "#f97316";
    case "ending":
      return "#ef4444";
    default:
      return "#64748b";
  }
}

// ─── Scene Operations (pure functions) ───

const MIN_DURATION_FRAMES = 15;

/** Reorder scenes by moving scene at fromIndex to toIndex */
export function reorderScenes(scenes: Scene[], fromIndex: number, toIndex: number): Scene[] {
  if (fromIndex === toIndex) return scenes;
  const result = [...scenes];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

/** Trim scene duration. Respects minimum of MIN_DURATION_FRAMES. */
export function trimScene(
  scenes: Scene[],
  sceneId: string,
  newDurationFrames: number
): Scene[] {
  return scenes.map((s) =>
    s.id === sceneId
      ? { ...s, durationFrames: Math.max(MIN_DURATION_FRAMES, Math.round(newDurationFrames)) }
      : s
  );
}

/** Delete a scene by ID. Won't delete if it's the last scene. */
export function deleteScene(scenes: Scene[], sceneId: string): Scene[] {
  if (scenes.length <= 1) return scenes;
  return scenes.filter((s) => s.id !== sceneId);
}

/** Duplicate a scene, inserting the copy right after the original */
export function duplicateScene(scenes: Scene[], sceneId: string): Scene[] {
  const idx = scenes.findIndex((s) => s.id === sceneId);
  if (idx === -1) return scenes;
  const original = scenes[idx];
  const clone: Scene = {
    ...structuredClone(original),
    id: crypto.randomUUID(),
    title: original.title ? `${original.title} (コピー)` : undefined,
  };
  const result = [...scenes];
  result.splice(idx + 1, 0, clone);
  return result;
}

/** Split a scene at a given frame offset within the scene */
export function splitScene(
  scenes: Scene[],
  sceneId: string,
  splitAtFrame: number
): Scene[] {
  const idx = scenes.findIndex((s) => s.id === sceneId);
  if (idx === -1) return scenes;
  const scene = scenes[idx];

  if (splitAtFrame < MIN_DURATION_FRAMES || splitAtFrame > scene.durationFrames - MIN_DURATION_FRAMES) {
    return scenes;
  }

  const first: Scene = {
    ...structuredClone(scene),
    durationFrames: splitAtFrame,
  };
  const second: Scene = {
    ...structuredClone(scene),
    id: crypto.randomUUID(),
    durationFrames: scene.durationFrames - splitAtFrame,
    title: scene.title ? `${scene.title} (後半)` : undefined,
  };

  const result = [...scenes];
  result.splice(idx, 1, first, second);
  return result;
}

/** Add a new empty scene after the given sceneId (or at end if null) */
export function addScene(
  scenes: Scene[],
  afterSceneId: string | null,
  fps: number
): Scene[] {
  const newScene: Scene = {
    id: crypto.randomUUID(),
    type: "text",
    title: "新しいシーン",
    durationFrames: fps * 5, // 5 seconds
    background: { type: "color", value: "#1a1a2e", opacity: 1 },
    texts: [
      {
        id: crypto.randomUUID(),
        content: "テキストを入力",
        x: 50,
        y: 50,
        fontSize: 48,
        fontFamily: "Noto Sans JP",
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
        maxWidth: 80,
        lineHeight: 1.4,
        animation: "fade-in",
        animationDelay: 0,
        animationDuration: 20,
      },
    ],
    images: [],
    audio: [],
    transition: { type: "fade", durationFrames: 15 },
  };

  if (afterSceneId === null) {
    return [...scenes, newScene];
  }

  const idx = scenes.findIndex((s) => s.id === afterSceneId);
  if (idx === -1) return [...scenes, newScene];
  const result = [...scenes];
  result.splice(idx + 1, 0, newScene);
  return result;
}

/** Recalculate totalDurationFrames from scenes */
export function recalcTotalDuration(blueprint: VideoBlueprint): VideoBlueprint {
  const total = blueprint.scenes.reduce((sum, s) => sum + s.durationFrames, 0);
  return { ...blueprint, totalDurationFrames: total };
}
