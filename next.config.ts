import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "mongodb",
    "sharp",
  ],
  outputFileTracingIncludes: {
    "/api/render": ["./remotion/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
