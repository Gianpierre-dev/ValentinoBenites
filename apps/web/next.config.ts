import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Proxy de imágenes del backend (sirve las fotos subidas a Wasabi).
      { protocol: "https", hostname: "api-production-2c9f.up.railway.app" },
      { protocol: "http", hostname: "localhost", port: "4024" },
    ],
  },
};

export default nextConfig;
