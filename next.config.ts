import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "uccollege.edu.in" }],
  },
};

export default nextConfig;
