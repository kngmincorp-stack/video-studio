import type { Scene } from "@/types/schema";
import { TitleScene } from "./scenes/TitleScene";
import { TextScene } from "./scenes/TextScene";
import { ListScene } from "./scenes/ListScene";
import { ComparisonScene } from "./scenes/ComparisonScene";
import { EndingScene } from "./scenes/EndingScene";

interface SceneRouterProps {
  scene: Scene;
  width: number;
  height: number;
}

/** Scene type に基づいて適切なシーンコンポーネントをレンダリング */
export const SceneRouter: React.FC<SceneRouterProps> = ({
  scene,
  width,
  height,
}) => {
  const props = { scene, width, height };

  switch (scene.type) {
    case "title":
      return <TitleScene {...props} />;
    case "text":
    case "narration":
    case "image":
      return <TextScene {...props} />;
    case "list":
      return <ListScene {...props} />;
    case "comparison":
      return <ComparisonScene {...props} />;
    case "ending":
      return <EndingScene {...props} />;
    default:
      return <TextScene {...props} />;
  }
};
