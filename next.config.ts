import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/promptbin',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
