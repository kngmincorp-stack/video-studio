import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import {
  createAudioQuery,
  synthesis,
  extractMoraTimings,
  getAudioDuration,
} from "@/lib/voicevox/client";

const AUDIO_DIR = join(process.cwd(), "public", "audio");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      speakerId = 0,
      speedScale = 1.0,
      pitchScale = 1.0,
      intonationScale,
      volumeScale,
      prePhonemeLength,
      postPhonemeLength,
    }: {
      text: string;
      speakerId?: number;
      speedScale?: number;
      pitchScale?: number;
      intonationScale?: number;
      volumeScale?: number;
      prePhonemeLength?: number;
      postPhonemeLength?: number;
    } = body;

    if (!text) {
      return NextResponse.json({ error: "テキストが必要です" }, { status: 400 });
    }

    // 1. AudioQuery生成
    const audioQuery = await createAudioQuery(text, speakerId);

    // パラメータ上書き
    audioQuery.speedScale = speedScale;
    audioQuery.pitchScale = pitchScale;
    audioQuery.intonationScale = intonationScale ?? audioQuery.intonationScale;
    audioQuery.volumeScale = volumeScale ?? audioQuery.volumeScale;
    audioQuery.prePhonemeLength = prePhonemeLength ?? audioQuery.prePhonemeLength;
    audioQuery.postPhonemeLength = postPhonemeLength ?? audioQuery.postPhonemeLength;

    // 2. 音声合成
    const wavBuffer = await synthesis(audioQuery, speakerId);

    // 3. WAVファイル保存
    await mkdir(AUDIO_DIR, { recursive: true });
    const filename = `narration-${Date.now()}.wav`;
    const filepath = join(AUDIO_DIR, filename);
    await writeFile(filepath, wavBuffer);

    // 4. モーラタイミング抽出 (字幕同期用)
    const moraTimings = extractMoraTimings(audioQuery);
    const durationSeconds = getAudioDuration(audioQuery);

    return NextResponse.json({
      audioPath: `/audio/${filename}`,
      durationSeconds,
      moraTimings,
    });
  } catch (error) {
    console.error("Voicevox generate error:", error);
    return NextResponse.json(
      { error: "音声生成に失敗しました。Voicevox Engineが起動しているか確認してください。" },
      { status: 500 }
    );
  }
}
