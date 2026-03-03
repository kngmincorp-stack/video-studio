import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { Scene } from "@/types/schema";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { AnimatedText } from "../components/AnimatedText";

interface ListSceneProps {
  scene: Scene;
  width: number;
  height: number;
}

export const ListScene: React.FC<ListSceneProps> = ({
  scene,
  width,
  height,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = scene.listItems ?? [];

  const startY = 25;
  const itemSpacing = Math.min(12, 60 / Math.max(items.length, 1));

  return (
    <AbsoluteFill>
      <BackgroundLayer
        background={scene.background}
        width={width}
        height={height}
      />
      {/* Scene title */}
      {scene.texts.map((text) => (
        <AnimatedText key={text.id} element={text} />
      ))}
      {/* List items with staggered spring animation */}
      {items.map((item, i) => {
        const delay = 15 + i * 8;
        const itemSpring = spring({
          frame: frame - delay,
          fps,
          config: { damping: 200 },
          durationInFrames: 20,
        });
        const yPos = startY + (i + 1) * itemSpacing;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "10%",
              top: `${yPos}%`,
              width: "80%",
              opacity: itemSpring,
              transform: `translateX(${(1 - itemSpring) * 40}px)`,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#FFD700",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 36,
                fontFamily: "Noto Sans JP",
                fontWeight: 600,
                color: "#FFFFFF",
                lineHeight: 1.5,
              }}
            >
              {item}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
