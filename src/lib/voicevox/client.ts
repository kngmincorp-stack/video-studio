const VOICEVOX_URL = process.env.VOICEVOX_URL || "http://localhost:50021";

export interface VoicevoxSpeaker {
  name: string;
  speaker_uuid: string;
  styles: Array<{
    name: string;
    id: number;
  }>;
}

export interface Mora {
  text: string;
  vowel: string;
  vowel_length: number;
  consonant?: string;
  consonant_length?: number;
  pitch: number;
}

export interface AccentPhrase {
  moras: Mora[];
  accent: number;
  pause_mora?: Mora;
}

export interface AudioQuery {
  accent_phrases: AccentPhrase[];
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
}

/** スピーカー一覧を取得 */
export async function getSpeakers(): Promise<VoicevoxSpeaker[]> {
  const res = await fetch(`${VOICEVOX_URL}/speakers`);
  if (!res.ok) throw new Error(`Voicevox speakers error: ${res.status}`);
  return res.json();
}

/** テキストからAudioQueryを生成 */
export async function createAudioQuery(
  text: string,
  speakerId: number
): Promise<AudioQuery> {
  const res = await fetch(
    `${VOICEVOX_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Voicevox audio_query error: ${res.status}`);
  return res.json();
}

/** AudioQueryから音声合成 (WAVバイナリ) */
export async function synthesis(
  audioQuery: AudioQuery,
  speakerId: number
): Promise<Buffer> {
  const res = await fetch(
    `${VOICEVOX_URL}/synthesis?speaker=${speakerId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(audioQuery),
    }
  );
  if (!res.ok) throw new Error(`Voicevox synthesis error: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** AudioQueryからモーラのタイミング情報を抽出 (字幕同期用) */
export function extractMoraTimings(
  audioQuery: AudioQuery
): Array<{ text: string; startTime: number; endTime: number }> {
  const timings: Array<{ text: string; startTime: number; endTime: number }> =
    [];
  let currentTime = audioQuery.prePhonemeLength;

  for (const phrase of audioQuery.accent_phrases) {
    for (const mora of phrase.moras) {
      const consonantLen = mora.consonant_length ?? 0;
      const vowelLen = mora.vowel_length;
      const totalLen = consonantLen + vowelLen;

      timings.push({
        text: mora.text,
        startTime: currentTime,
        endTime: currentTime + totalLen,
      });
      currentTime += totalLen;
    }
    // Pause mora between phrases
    if (phrase.pause_mora) {
      currentTime += phrase.pause_mora.vowel_length;
    }
  }

  return timings;
}

/** 全体の音声長(秒)を算出 */
export function getAudioDuration(audioQuery: AudioQuery): number {
  let duration = audioQuery.prePhonemeLength;
  for (const phrase of audioQuery.accent_phrases) {
    for (const mora of phrase.moras) {
      duration += (mora.consonant_length ?? 0) + mora.vowel_length;
    }
    if (phrase.pause_mora) {
      duration += phrase.pause_mora.vowel_length;
    }
  }
  duration += audioQuery.postPhonemeLength;
  return duration / audioQuery.speedScale;
}
