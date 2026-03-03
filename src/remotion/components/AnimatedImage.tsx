import { useCurrentFrame, useVideoConfig, Img } from "remotion";
import type { ImageElement } from "@/types/schema";
import { getAnimationStyle } from "../utils/animations";

interface AnimatedImageProps {
  element: ImageElement;
}

export const AnimatedImage: React.FC<AnimatedImageProps> = ({ element }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const {
    src,
    x,
    y,
    width,
    height,
    objectFit,
    borderRadius,
    opacity,
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

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
    width: `${width}%`,
    ...(height !== undefined && { height: `${height}%` }),
    opacity,
    ...animStyle,
  };

  return (
    <div style={containerStyle}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          borderRadius,
        }}
      />
    </div>
  );
};
