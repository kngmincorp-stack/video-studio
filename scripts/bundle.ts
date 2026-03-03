/**
 * Remotion バンドルスクリプト
 * Next.js の Webpack と衝突を避けるため、事前にバンドルを生成する
 *
 * 使い方: npx tsx scripts/bundle.ts
 */

import { bundle } from "@remotion/bundler";
import path from "path";

async function main() {
  console.log("Remotion バンドル開始...");

  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "../remotion/index.ts"),
    webpackOverride: (config) => config,
  });

  console.log(`バンドル完了: ${bundleLocation}`);
  return bundleLocation;
}

main().catch((err) => {
  console.error("バンドルエラー:", err);
  process.exit(1);
});
