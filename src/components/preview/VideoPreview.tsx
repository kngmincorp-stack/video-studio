"use client";

import { useMemo } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import type { VideoBlueprint } from "@/types/schema";
import { VideoComposition } from "@/remotion/VideoComposition";

interface VideoPreviewProps {
  blueprint: VideoBlueprint;
  playerRef: React.RefObject<PlayerRef | null>;
}

export function VideoPreview({ blueprint, playerRef }: VideoPreviewProps) {
  const inputProps = useMemo(() => ({ blueprint }), [blueprint]);

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
          maxHeight: "100%",
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
          autoPlay={false}
          loop
        />
      </div>
    </div>
  );
}
