// Timeline UI state types — not persisted, not part of Blueprint

export interface TimelineState {
  /** Frames per pixel. Lower = more zoomed in. Range: 0.5–10 */
  zoomLevel: number;
  /** Horizontal scroll offset in pixels */
  scrollLeft: number;
  /** Currently selected scene ID */
  selectedSceneId: string | null;
  /** Current playhead position in frames */
  playheadFrame: number;
  /** Whether playback is active */
  isPlaying: boolean;
  /** Active drag operation */
  dragState: DragState | null;
}

export interface DragState {
  type: "move" | "trim-start" | "trim-end" | "playhead";
  sceneId?: string;
  /** Pointer X at drag start */
  startX: number;
  /** Frame value at drag start */
  startFrame: number;
  /** Current pointer X */
  currentX: number;
}

export interface SceneLayoutItem {
  sceneId: string;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  type: string;
  title: string;
}

export type TimelineAction =
  | { type: "SET_ZOOM"; zoomLevel: number }
  | { type: "SET_SCROLL"; scrollLeft: number }
  | { type: "SELECT_SCENE"; sceneId: string | null }
  | { type: "SET_PLAYHEAD"; frame: number }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "START_DRAG"; dragState: DragState }
  | { type: "UPDATE_DRAG"; currentX: number }
  | { type: "END_DRAG" };
