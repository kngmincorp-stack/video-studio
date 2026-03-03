import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { TextElement } from "@/types/schema";
import { getAnimationStyle } from "../utils/animations";

interface AnimatedTextProps {
  element: TextElement;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({ element }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const {
    content,
    x,
    y,
    fontSize,
    fontFamily,
    fontWeight,
    color,
    textAlign,
    maxWidth,
    lineHeight,
    strokeColor,
    strokeWidth,
    shadow,
    animation,
    animationDelay,
    animationDuration,
  } = element;

  const animStyle = getAnimationStyle(animation, {
    frame,
    fps,
    delay: animationDelay,
    duration: animationDuration,
  });

  // Typewriter: slice content based on progress
  const displayContent =
    animation === "typewriter"
      ? content.slice(
          0,
          Math.floor(
            interpolate(
              frame - animationDelay,
              [0, animationDuration],
              [0, content.length],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          )
        )
      : content;

  const textStyle: React.CSSProperties = {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
    fontSize,
    fontFamily,
    fontWeight: Number(fontWeight),
    color,
    textAlign,
    maxWidth: `${maxWidth}%`,
    lineHeight,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    ...(shadow && { textShadow: shadow }),
    ...(strokeColor &&
      strokeWidth && {
        WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
      }),
    ...animStyle,
  };

  return <div style={textStyle}>{displayContent}</div>;
};
