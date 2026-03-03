import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Remotion requires server-side rendering support for renderer
  serverExternalPackages: ["@remotion/renderer", "@remotion/bundler"],
  // Allow long API responses for rendering
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
