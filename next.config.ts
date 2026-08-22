import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    imageSizes: [32, 48, 64, 70, 96, 112, 128, 256, 384, 420, 480],
    qualities: [60, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
