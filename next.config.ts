import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/instagram-follower-manager",
  images: { unoptimized: true },
};

export default nextConfig;
