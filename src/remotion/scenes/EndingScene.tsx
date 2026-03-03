import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { Scene } from "@/types/schema";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { AnimatedText } from "../components/AnimatedText";

interface EndingSceneProps {
  scene: Scene;
  width: number;
  height: number;
}

export const EndingScene: React.FC<EndingSceneProps> = ({
  scene,
  width,
  height,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade out at the end of the scene
  const fadeOutStart = scene.durationFrames - 30;
  const fadeOutProgress =
    frame > fadeOutStart
      ? 1 - (frame - fadeOutStart) / 30
      : 1;

  return (
    <AbsoluteFill style={{ opacity: Math.max(0, fadeOutProgress) }}>
      <BackgroundLayer
        background={scene.background}
        width={width}
        height={height}
      />
      {scene.texts.map((text) => (
        <AnimatedText key={text.id} element={text} />
      ))}
    </AbsoluteFill>
  );
};
