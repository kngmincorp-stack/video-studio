import { z } from "zod";

export const TRANSCRIPTION_SYSTEM_PROMPT = `あなたは高精度な文字起こしアシスタントです。
提供された音声・動画ファイルの内容を正確に文字起こししてください。

ルール:
- 音声の言語を自動判定してください（主に日本語を想定）
- タイムスタンプ付きのセグメントに分割してください（各セグメント2〜15秒程度）
- 句読点を適切に付けてください（「。」「、」「！」「？」）
- 話者が変わる場合はセグメントを分けてください
- 聞き取れない部分は「[不明瞭]」と記載してください
- フィラー（えーと、あのー等）は省略してください
- 音声がない区間はスキップしてください
- durationSecondsはファイル全体の長さ（秒）を推定してください`;

export const TranscriptionSegmentSchema = z.object({
  startTime: z.number().describe("セグメント開始時間（秒）"),
  endTime: z.number().describe("セグメント終了時間（秒）"),
  text: z.string().describe("文字起こしテキスト"),
});

export const TranscriptionResponseSchema = z.object({
  language: z.string().describe("検出された言語（例: ja, en）"),
  durationSeconds: z.number().describe("音声全体の長さ（秒）"),
  segments: z.array(TranscriptionSegmentSchema).describe("タイムスタンプ付きセグメント"),
});

export type TranscriptionResponse = z.infer<typeof TranscriptionResponseSchema>;
