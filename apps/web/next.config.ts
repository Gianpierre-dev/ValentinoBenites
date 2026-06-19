import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Imagenes de productos alojadas en Wasabi (S3-compatible).
      { protocol: "https", hostname: "*.wasabisys.com" },
      // Placeholder local del backend cuando faltan credenciales WASABI_*.
      { protocol: "http", hostname: "localhost", port: "3001" },
    ],
  },
};

export default nextConfig;
