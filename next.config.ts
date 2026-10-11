import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every screen is personal and reads the session, so the Cache Components
  // model (static shell + Suspense everywhere) buys little here. Classic
  // dynamic rendering keeps the code simple for a solo builder.
  cacheComponents: false,
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
