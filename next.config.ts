import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Vercel compatibility: Lightning CSS disabled via NEXT_DISABLE_LIGHTNINGCSS=1 env var
  // Tailwind v4 uses @tailwindcss/postcss which has its own CSS processing

  // Configure webpack for mapbox-gl compatibility
  webpack: (config, { isServer }) => {
    // Fix for mapbox-gl: ignore Node.js modules that don't work in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // Exclude mapbox-gl from server-side rendering
    if (isServer) {
      config.externals = [...(config.externals || []), 'mapbox-gl'];
    }

    return config;
  },
};

export default nextConfig;
