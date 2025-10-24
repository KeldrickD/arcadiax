import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Force the root to this project to silence multiple lockfile warning
    root: __dirname,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
