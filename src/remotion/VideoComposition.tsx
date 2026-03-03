"use client";

import React from "react";
import { AbsoluteFill, Audio, Sequence } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import type { VideoBlueprint, TransitionType } from "@/types/schema";
import { SceneRouter } from "./SceneRouter";

interface VideoCompositionProps {
  blueprint: VideoBlueprint;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTransitionPresentation(type: TransitionType): any {
  switch (type) {
    case "fade":
      return fade();
    case "slide-left":
      return slide({ direction: "from-right" });
    case "slide-right":
      return slide({ direction: "from-left" });
    case "slide-up":
      return slide({ direction: "from-bottom" });
    case "slide-down":
      return slide({ direction: "from-top" });
    case "wipe":
      return wipe({ direction: "from-left" });
    case "flip":
      return flip({ direction: "from-right" });
    default:
      return fade();
  }
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  blueprint,
}) => {
  const { scenes, globalAudio, width, height } = blueprint;

  // TransitionSeries children: Sequence → Transition → Sequence → ... (siblings)
  const transitionChildren: React.ReactNode[] = [];
  scenes.forEach((scene, i) => {
    // Add scene sequence
    transitionChildren.push(
      <TransitionSeries.Sequence
        key={`scene-${scene.id}`}
        durationInFrames={scene.durationFrames}
      >
        <AbsoluteFill>
          <SceneRouter scene={scene} width={width} height={height} />
          {/* Scene-level audio */}
          {scene.audio.map((a) => (
            <Audio
              key={a.id}
              src={a.src}
              volume={a.volume}
              startFrom={a.startFrom}
              loop={a.loop}
            />
          ))}
          {/* Narration audio */}
          {scene.narration?.generatedAudioPath && (
            <Audio src={scene.narration.generatedAudioPath} volume={1} />
          )}
        </AbsoluteFill>
      </TransitionSeries.Sequence>
    );

    // Add transition between scenes (as sibling, not child)
    const transType = scene.transition?.type ?? "fade";
    const transDuration = scene.transition?.durationFrames ?? 15;
    if (transType !== "none" && i < scenes.length - 1) {
      transitionChildren.push(
        <TransitionSeries.Transition
          key={`trans-${scene.id}`}
          presentation={getTransitionPresentation(transType)}
          timing={linearTiming({ durationInFrames: transDuration })}
        />
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>{transitionChildren}</TransitionSeries>

      {/* Global audio (BGM) */}
      {globalAudio.map((a) => (
        <Sequence key={a.id} from={a.startFrom}>
          <Audio src={a.src} volume={a.volume} loop={a.loop} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
