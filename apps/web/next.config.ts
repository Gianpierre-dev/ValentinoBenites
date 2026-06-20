import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Imagenes de productos alojadas en Wasabi (S3-compatible).
      { protocol: "https", hostname: "*.wasabisys.com" },
      // Imagenes de ejemplo del seed (datos de demostracion).
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Placeholder local del backend cuando faltan credenciales WASABI_*.
      { protocol: "http", hostname: "localhost", port: "4024" },
    ],
  },
};

export default nextConfig;
