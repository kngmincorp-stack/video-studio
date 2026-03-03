import { AbsoluteFill } from "remotion";
import type { Scene } from "@/types/schema";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { AnimatedText } from "../components/AnimatedText";
import { AnimatedImage } from "../components/AnimatedImage";

interface TitleSceneProps {
  scene: Scene;
  width: number;
  height: number;
}

export const TitleScene: React.FC<TitleSceneProps> = ({
  scene,
  width,
  height,
}) => {
  return (
    <AbsoluteFill>
      <BackgroundLayer
        background={scene.background}
        width={width}
        height={height}
      />
      {scene.images.map((img) => (
        <AnimatedImage key={img.id} element={img} />
      ))}
      {scene.texts.map((text) => (
        <AnimatedText key={text.id} element={text} />
      ))}
    </AbsoluteFill>
  );
};
