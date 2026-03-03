import { AIResponseSchema } from "./response-schema";
import type { VideoBlueprint } from "@/types/schema";

/**
 * Gemini構造化出力のJSONオブジェクトをパースし検証する
 */
export function parseAIResponse(json: unknown): {
  blueprint: VideoBlueprint | null;
  message: string;
} {
  const result = AIResponseSchema.safeParse(json);

  if (result.success) {
    return {
      blueprint: result.data.blueprint,
      message: result.data.message || "動画を生成しました。",
    };
  }

  console.error("AI response validation failed:", result.error.issues);
  return {
    blueprint: null,
    message: "レスポンスの検証に失敗しました。再試行してください。",
  };
}
