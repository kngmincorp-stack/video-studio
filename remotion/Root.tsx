import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "../src/remotion/VideoComposition";
import { createEmptyBlueprint } from "../src/types/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Comp = VideoComposition as React.FC<any>;

export const RemotionRoot: React.FC = () => {
  const defaultBlueprint = createEmptyBlueprint("short-9x16");

  return (
    <>
      <Composition
        id="VideoStudio"
        component={Comp}
        durationInFrames={defaultBlueprint.totalDurationFrames}
        fps={defaultBlueprint.fps}
        width={defaultBlueprint.width}
        height={defaultBlueprint.height}
        defaultProps={{ blueprint: defaultBlueprint }}
      />
      <Composition
        id="VideoStudio-16x9"
        component={Comp}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ blueprint: createEmptyBlueprint("long-16x9") }}
      />
    </>
  );
};
