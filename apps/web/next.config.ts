import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bidding-agents/auction", "@bidding-agents/pi"],
  serverExternalPackages: [
    "@earendil-works/pi-coding-agent",
    "quickjs-wasi",
  ],
  cacheComponents: true,
  partialPrefetching: true,
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
