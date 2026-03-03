import { z } from "zod";

// ============================================================
// VideoBlueprint — 動画生成の中心データ構造
// AI (Gemini) が生成し、Remotion がレンダリングする JSON スキーマ
// ============================================================

// --- Enums ---

export const FormatSchema = z.enum(["short-9x16", "long-16x9"]);
export type Format = z.infer<typeof FormatSchema>;

export const TransitionTypeSchema = z.enum([
  "none",
  "fade",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "wipe",
  "flip",
]);
export type TransitionType = z.infer<typeof TransitionTypeSchema>;

export const SceneTypeSchema = z.enum([
  "title",
  "narration",
  "text",
  "image",
  "list",
  "comparison",
  "ending",
]);
export type SceneType = z.infer<typeof SceneTypeSchema>;

export const TextAlignSchema = z.enum(["left", "center", "right"]);

export const AnimationTypeSchema = z.enum([
  "none",
  "fade-in",
  "fade-out",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "scale-in",
  "scale-out",
  "typewriter",
  "bounce-in",
  "blur-in",
]);
export type AnimationType = z.infer<typeof AnimationTypeSchema>;

// --- Background ---

export const BackgroundSchema = z.object({
  type: z.enum(["color", "gradient", "image", "video"]),
  value: z.string(), // CSS color, gradient string, or URL
  opacity: z.number().min(0).max(1).default(1),
  overlay: z
    .object({
      color: z.string().default("rgba(0,0,0,0.4)"),
      opacity: z.number().min(0).max(1).default(0.4),
    })
    .optional(),
});
export type Background = z.infer<typeof BackgroundSchema>;

// --- Text Element ---

export const TextElementSchema = z.object({
  id: z.string(),
  content: z.string(),
  x: z.number().default(50), // % from left
  y: z.number().default(50), // % from top
  fontSize: z.number().default(48),
  fontFamily: z.string().default("Noto Sans JP"),
  fontWeight: z.enum(["400", "500", "600", "700", "800", "900"]).default("700"),
  color: z.string().default("#FFFFFF"),
  textAlign: TextAlignSchema.default("center"),
  maxWidth: z.number().default(80), // % of composition width
  lineHeight: z.number().default(1.4),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().optional(),
  shadow: z.string().optional(), // CSS text-shadow
  animation: AnimationTypeSchema.default("fade-in"),
  animationDelay: z.number().default(0), // frames
  animationDuration: z.number().default(20), // frames
});
export type TextElement = z.infer<typeof TextElementSchema>;

// --- Image Element ---

export const ImageElementSchema = z.object({
  id: z.string(),
  src: z.string(), // URL or local path
  x: z.number().default(50),
  y: z.number().default(50),
  width: z.number().default(80), // % of composition width
  height: z.number().optional(), // auto if not set
  objectFit: z.enum(["cover", "contain", "fill"]).default("contain"),
  borderRadius: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  animation: AnimationTypeSchema.default("fade-in"),
  animationDelay: z.number().default(0),
  animationDuration: z.number().default(20),
});
export type ImageElement = z.infer<typeof ImageElementSchema>;

// --- Audio Element ---

export const AudioElementSchema = z.object({
  id: z.string(),
  src: z.string(),
  volume: z.number().min(0).max(1).default(1),
  startFrom: z.number().default(0), // frames
  loop: z.boolean().default(false),
  fadeIn: z.number().default(0), // frames
  fadeOut: z.number().default(0), // frames
});
export type AudioElement = z.infer<typeof AudioElementSchema>;

// --- Narration ---

export const NarrationSchema = z.object({
  text: z.string(),
  speakerId: z.number().default(0),
  speedScale: z.number().default(1.0),
  pitchScale: z.number().default(1.0),
  intonationScale: z.number().default(1.0),
  volumeScale: z.number().default(1.0),
  prePhonemeLength: z.number().default(0.1),
  postPhonemeLength: z.number().default(0.1),
  generatedAudioPath: z.string().optional(), // set after Voicevox synthesis
  audioDurationFrames: z.number().optional(), // set after synthesis
  showCaptions: z.boolean().default(true),
  captionStyle: z
    .object({
      fontSize: z.number().default(36),
      color: z.string().default("#FFFFFF"),
      highlightColor: z.string().default("#FFD700"),
      position: z.enum(["top", "center", "bottom"]).default("bottom"),
      background: z.string().optional(),
    })
    .optional(),
});
export type Narration = z.infer<typeof NarrationSchema>;

// --- Transition ---

export const TransitionSchema = z.object({
  type: TransitionTypeSchema.default("fade"),
  durationFrames: z.number().default(15),
});
export type Transition = z.infer<typeof TransitionSchema>;

// --- Scene ---

export const SceneSchema = z.object({
  id: z.string(),
  type: SceneTypeSchema,
  title: z.string().optional(),
  durationFrames: z.number().min(1),
  background: BackgroundSchema.default({
    type: "color",
    value: "#1a1a2e",
    opacity: 1,
  }),
  texts: z.array(TextElementSchema).default([]),
  images: z.array(ImageElementSchema).default([]),
  audio: z.array(AudioElementSchema).default([]),
  narration: NarrationSchema.optional(),
  transition: TransitionSchema.default({ type: "fade", durationFrames: 15 }),
  // Scene-type specific data
  listItems: z.array(z.string()).optional(), // for "list" type
  comparisonLeft: z.string().optional(), // for "comparison" type
  comparisonRight: z.string().optional(),
});
export type Scene = z.infer<typeof SceneSchema>;

// --- Default Narration Settings ---

export const DefaultNarrationSchema = z.object({
  speakerId: z.number().default(0),
  speedScale: z.number().default(1.0),
  pitchScale: z.number().default(1.0),
  intonationScale: z.number().default(1.0),
  volumeScale: z.number().default(1.0),
  prePhonemeLength: z.number().default(0.1),
  postPhonemeLength: z.number().default(0.1),
});
export type DefaultNarration = z.infer<typeof DefaultNarrationSchema>;

// --- VideoBlueprint (top-level) ---

export const VideoBlueprintSchema = z.object({
  id: z.string(),
  title: z.string(),
  format: FormatSchema.default("short-9x16"),
  width: z.number().default(1080),
  height: z.number().default(1920),
  fps: z.number().default(30),
  totalDurationFrames: z.number().min(1),
  scenes: z.array(SceneSchema).min(1),
  globalAudio: z.array(AudioElementSchema).default([]),
  defaultNarration: DefaultNarrationSchema.default({
    speakerId: 0,
    speedScale: 1.0,
    pitchScale: 1.0,
    intonationScale: 1.0,
    volumeScale: 1.0,
    prePhonemeLength: 0.1,
    postPhonemeLength: 0.1,
  }),
});
export type VideoBlueprint = z.infer<typeof VideoBlueprintSchema>;

// --- Helpers ---

export const FORMAT_PRESETS: Record<
  Format,
  { width: number; height: number; label: string }
> = {
  "short-9x16": { width: 1080, height: 1920, label: "ショート (9:16)" },
  "long-16x9": { width: 1920, height: 1080, label: "横長 (16:9)" },
};

/** デフォルトの空Blueprint */
export function createEmptyBlueprint(
  format: Format = "short-9x16"
): VideoBlueprint {
  const preset = FORMAT_PRESETS[format];
  return {
    id: crypto.randomUUID(),
    title: "無題の動画",
    format,
    width: preset.width,
    height: preset.height,
    fps: 30,
    totalDurationFrames: 150, // 5 seconds default
    scenes: [
      {
        id: crypto.randomUUID(),
        type: "title",
        title: "タイトル",
        durationFrames: 150,
        background: { type: "color", value: "#1a1a2e", opacity: 1 },
        texts: [
          {
            id: crypto.randomUUID(),
            content: "タイトルを入力",
            x: 50,
            y: 50,
            fontSize: 64,
            fontFamily: "Noto Sans JP",
            fontWeight: "800",
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
      },
    ],
    globalAudio: [],
    defaultNarration: {
      speakerId: 0,
      speedScale: 1.0,
      pitchScale: 1.0,
      intonationScale: 1.0,
      volumeScale: 1.0,
      prePhonemeLength: 0.1,
      postPhonemeLength: 0.1,
    },
  };
}
