import { AbsoluteFill, Img, OffthreadVideo } from "remotion";
import type { Background } from "@/types/schema";

interface BackgroundLayerProps {
  background: Background;
  width: number;
  height: number;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  background,
  width,
  height,
}) => {
  const { type, value, opacity, overlay } = background;

  return (
    <AbsoluteFill>
      {/* Main background */}
      {type === "color" && (
        <AbsoluteFill style={{ backgroundColor: value, opacity }} />
      )}

      {type === "gradient" && (
        <AbsoluteFill style={{ background: value, opacity }} />
      )}

      {type === "image" && (
        <AbsoluteFill style={{ opacity }}>
          <Img
            src={value}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}

      {type === "video" && (
        <AbsoluteFill style={{ opacity }}>
          <OffthreadVideo
            src={value}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}

      {/* Overlay */}
      {overlay && (
        <AbsoluteFill
          style={{
            backgroundColor: overlay.color,
            opacity: overlay.opacity,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
