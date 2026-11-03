import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // The home screen arrives in phase 2. Until then, the data page is the project's interface.
  async redirects() {
    return [{ source: "/", destination: "/dados", permanent: false }];
  },
};

export default nextConfig;
