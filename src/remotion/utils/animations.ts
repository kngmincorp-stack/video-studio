import { interpolate, spring, Easing } from "remotion";
import type { AnimationType } from "@/types/schema";

interface AnimationConfig {
  frame: number;
  fps: number;
  delay?: number;
  duration?: number;
}

/**
 * アニメーションタイプに基づいて transform + opacity の style を返す
 * Remotionルール: 全アニメーションは useCurrentFrame() 駆動
 */
export function getAnimationStyle(
  type: AnimationType,
  config: AnimationConfig
): React.CSSProperties {
  const { frame, fps, delay = 0, duration = 20 } = config;
  const adjustedFrame = frame - delay;

  if (adjustedFrame < 0) {
    // アニメーション開始前は非表示
    return { opacity: 0 };
  }

  const progress = interpolate(adjustedFrame, [0, duration], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const springProgress = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 200 },
    durationInFrames: duration,
  });

  const bouncySpring = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 8, mass: 0.5 },
    durationInFrames: duration,
  });

  switch (type) {
    case "none":
      return { opacity: 1 };

    case "fade-in":
      return { opacity: progress };

    case "fade-out":
      return { opacity: 1 - progress };

    case "slide-up":
      return {
        opacity: springProgress,
        transform: `translateY(${interpolate(springProgress, [0, 1], [60, 0])}px)`,
      };

    case "slide-down":
      return {
        opacity: springProgress,
        transform: `translateY(${interpolate(springProgress, [0, 1], [-60, 0])}px)`,
      };

    case "slide-left":
      return {
        opacity: springProgress,
        transform: `translateX(${interpolate(springProgress, [0, 1], [80, 0])}px)`,
      };

    case "slide-right":
      return {
        opacity: springProgress,
        transform: `translateX(${interpolate(springProgress, [0, 1], [-80, 0])}px)`,
      };

    case "scale-in":
      return {
        opacity: springProgress,
        transform: `scale(${interpolate(springProgress, [0, 1], [0.5, 1])})`,
      };

    case "scale-out":
      return {
        opacity: 1 - progress,
        transform: `scale(${interpolate(progress, [0, 1], [1, 0.5])})`,
      };

    case "typewriter":
      // typewriter は AnimatedText で content を slice するため、ここでは opacity のみ
      return { opacity: 1 };

    case "bounce-in":
      return {
        opacity: Math.min(bouncySpring * 2, 1),
        transform: `scale(${interpolate(bouncySpring, [0, 1], [0, 1])})`,
      };

    case "blur-in": {
      const blur = interpolate(progress, [0, 1], [10, 0], {
        extrapolateRight: "clamp",
      });
      return {
        opacity: progress,
        filter: `blur(${blur}px)`,
      };
    }

    default:
      return { opacity: 1 };
  }
}

/** フレーム数→秒 */
export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

/** 秒→フレーム数 */
export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}
