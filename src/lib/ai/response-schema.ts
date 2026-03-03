import { z } from "zod";
import { VideoBlueprintSchema } from "@/types/schema";

// Gemini構造化出力用のラッパースキーマ
export const AIResponseSchema = z.object({
  message: z.string(), // 説明 + 提案テキスト
  blueprint: VideoBlueprintSchema.nullable(), // 生成/修正されたBlueprint（会話のみの場合null）
});

export type AIResponse = z.infer<typeof AIResponseSchema>;
