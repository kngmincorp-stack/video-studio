import { NextRequest, NextResponse } from "next/server";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { mkdir } from "fs/promises";
import type { VideoBlueprint } from "@/types/schema";

const OUTPUT_DIR = path.resolve(process.cwd(), "output");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blueprint }: { blueprint: VideoBlueprint } = body;

    if (!blueprint) {
      return NextResponse.json(
        { error: "Blueprintが必要です" },
        { status: 400 }
      );
    }

    // 1. Bundle the Remotion project
    console.log("バンドル開始...");
    const bundleLocation = await bundle({
      entryPoint: path.resolve(process.cwd(), "remotion/index.ts"),
      webpackOverride: (config) => config,
    });

    // 2. Select composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "VideoStudio",
      inputProps: { blueprint },
    });

    // Override composition props with blueprint values
    composition.durationInFrames = blueprint.totalDurationFrames;
    composition.fps = blueprint.fps;
    composition.width = blueprint.width;
    composition.height = blueprint.height;

    // 3. Create output directory
    const projectDir = path.join(OUTPUT_DIR, blueprint.id);
    await mkdir(projectDir, { recursive: true });
    const outputPath = path.join(projectDir, "final.mp4");

    // 4. Render
    console.log("レンダリング開始...");
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: { blueprint },
    });

    console.log(`レンダリング完了: ${outputPath}`);

    return NextResponse.json({
      outputPath,
      message: "エクスポートが完了しました。",
    });
  } catch (error) {
    console.error("Render error:", error);
    return NextResponse.json(
      {
        error: `レンダリングに失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
