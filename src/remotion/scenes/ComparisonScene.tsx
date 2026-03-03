import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { Scene } from "@/types/schema";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { AnimatedText } from "../components/AnimatedText";

interface ComparisonSceneProps {
  scene: Scene;
  width: number;
  height: number;
}

export const ComparisonScene: React.FC<ComparisonSceneProps> = ({
  scene,
  width,
  height,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 25,
  });

  const rightSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200 },
    durationInFrames: 25,
  });

  const dividerOpacity = interpolate(frame, [20, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer
        background={scene.background}
        width={width}
        height={height}
      />
      {scene.texts.map((text) => (
        <AnimatedText key={text.id} element={text} />
      ))}

      {/* Divider */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "30%",
          height: "50%",
          width: 3,
          backgroundColor: "rgba(255,255,255,0.3)",
          transform: "translateX(-50%)",
          opacity: dividerOpacity,
        }}
      />

      {/* Left side */}
      <div
        style={{
          position: "absolute",
          left: "5%",
          top: "35%",
          width: "40%",
          textAlign: "center",
          opacity: leftSpring,
          transform: `translateX(${(1 - leftSpring) * -40}px)`,
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontFamily: "Noto Sans JP",
            fontWeight: 600,
            color: "#FFFFFF",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {scene.comparisonLeft ?? ""}
        </span>
      </div>

      {/* Right side */}
      <div
        style={{
          position: "absolute",
          right: "5%",
          top: "35%",
          width: "40%",
          textAlign: "center",
          opacity: rightSpring,
          transform: `translateX(${(1 - rightSpring) * 40}px)`,
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontFamily: "Noto Sans JP",
            fontWeight: 600,
            color: "#FFFFFF",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {scene.comparisonRight ?? ""}
        </span>
      </div>
    </AbsoluteFill>
  );
};
