import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { Narration } from "@/types/schema";

interface MoraTiming {
  text: string;
  startTime: number;
  endTime: number;
}

interface CaptionOverlayProps {
  narration: Narration;
  moraTimings?: MoraTiming[];
}

/**
 * TikTok風キャプション表示
 * モーラタイミングがあればワード単位でハイライト、
 * なければ全テキストをfade-inで表示
 */
export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  narration,
  moraTimings,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const style = narration.captionStyle ?? {
    fontSize: 36,
    color: "#FFFFFF",
    highlightColor: "#FFD700",
    position: "bottom" as const,
  };

  const currentTimeSeconds = frame / fps;

  const positionStyle: React.CSSProperties = {
    position: "absolute",
    left: "5%",
    right: "5%",
    textAlign: "center",
    ...(style.position === "top" && { top: "10%" }),
    ...(style.position === "center" && { top: "50%", transform: "translateY(-50%)" }),
    ...(style.position === "bottom" && { bottom: "10%" }),
  };

  // Simple fade-in without mora timings
  if (!moraTimings || moraTimings.length === 0) {
    const opacity = interpolate(frame, [0, 10], [0, 1], {
      extrapolateRight: "clamp",
    });
    return (
      <div style={positionStyle}>
        <span
          style={{
            fontSize: style.fontSize,
            fontFamily: "Noto Sans JP",
            fontWeight: 700,
            color: style.color,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            opacity,
          }}
        >
          {narration.text}
        </span>
      </div>
    );
  }

  // Word-level highlight with mora timings
  return (
    <div style={positionStyle}>
      {moraTimings.map((mora, i) => {
        const isActive =
          currentTimeSeconds >= mora.startTime &&
          currentTimeSeconds < mora.endTime;
        const isPast = currentTimeSeconds >= mora.endTime;
        const isFuture = currentTimeSeconds < mora.startTime;

        return (
          <span
            key={i}
            style={{
              fontSize: style.fontSize,
              fontFamily: "Noto Sans JP",
              fontWeight: 700,
              color: isActive
                ? style.highlightColor
                : isPast
                  ? style.color
                  : `${style.color}88`,
              textShadow: isActive
                ? `0 0 12px ${style.highlightColor}66`
                : "0 2px 8px rgba(0,0,0,0.8)",
              transition: "none", // Remotion: no CSS transitions
              ...(isActive && { transform: "scale(1.05)", display: "inline-block" }),
            }}
          >
            {mora.text}
          </span>
        );
      })}
    </div>
  );
};
