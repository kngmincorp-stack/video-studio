"use client";

import { useMemo, useState, useCallback } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import type { VideoBlueprint } from "@/types/schema";
import { VideoComposition } from "@/remotion/VideoComposition";
import { useRef } from "react";

interface VideoPreviewProps {
  blueprint: VideoBlueprint;
}

export function VideoPreview({ blueprint }: VideoPreviewProps) {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const inputProps = useMemo(() => ({ blueprint }), [blueprint]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Calculate aspect-ratio for responsive sizing
  const aspectRatio = blueprint.width / blueprint.height;
  const isVertical = aspectRatio < 1;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <div
        className="relative overflow-hidden rounded-lg border border-border bg-black shadow-lg"
        style={{
          width: isVertical ? "auto" : "100%",
          height: isVertical ? "100%" : "auto",
          maxHeight: "calc(100% - 48px)",
          maxWidth: "100%",
          aspectRatio: `${blueprint.width} / ${blueprint.height}`,
        }}
      >
        <Player
          ref={playerRef}
          component={VideoComposition}
          inputProps={inputProps}
          durationInFrames={Math.max(1, blueprint.totalDurationFrames)}
          compositionWidth={blueprint.width}
          compositionHeight={blueprint.height}
          fps={blueprint.fps}
          style={{ width: "100%", height: "100%" }}
          controls
          autoPlay={false}
          loop
        />
      </div>
    </div>
  );
}
