"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Loader2 } from "lucide-react";
import type { DefaultNarration } from "@/types/schema";

interface VoicevoxTestButtonProps {
  narration: DefaultNarration;
}

export function VoicevoxTestButton({ narration }: VoicevoxTestButtonProps) {
  const [state, setState] = useState<"idle" | "generating" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleTest = async () => {
    if (state === "playing") {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setState("idle");
      return;
    }

    setState("generating");
    try {
      const res = await fetch("/api/voicevox/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "これはテスト音声です。",
          speakerId: narration.speakerId,
          speedScale: narration.speedScale,
          pitchScale: narration.pitchScale,
          intonationScale: narration.intonationScale,
          volumeScale: narration.volumeScale,
          prePhonemeLength: narration.prePhonemeLength,
          postPhonemeLength: narration.postPhonemeLength,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      const audio = new Audio(data.audioPath);
      audioRef.current = audio;

      audio.onended = () => setState("idle");
      audio.onerror = () => setState("idle");

      setState("playing");
      await audio.play();
    } catch {
      setState("idle");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTest}
      disabled={state === "generating"}
      className="h-7 px-2 text-xs"
    >
      {state === "generating" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : state === "playing" ? (
        <Square className="h-3 w-3" />
      ) : (
        <Play className="h-3 w-3" />
      )}
    </Button>
  );
}
