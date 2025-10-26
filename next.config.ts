
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "obirfkjofdduzagjunwp.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/photos/**",
      },
    ],
  },
};

export default nextConfig;
