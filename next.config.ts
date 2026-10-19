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
  images: {
    formats: ["image/avif", "image/webp"],
    // Product photos uploaded from the admin panel live in Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  experimental: {
    serverActions: {
      // Photos are resized in the browser before upload; this leaves room for large PNGs.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
