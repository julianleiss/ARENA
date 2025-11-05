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

      // Use the pre-built mapbox-gl to avoid parsing issues
      config.resolve.alias = {
        ...config.resolve.alias,
        'mapbox-gl': 'mapbox-gl/dist/mapbox-gl.js',
      };
    }

    // Exclude mapbox-gl from server-side rendering
    if (isServer) {
      config.externals = [...(config.externals || []), 'mapbox-gl'];
    }

    // Don't parse mapbox-gl - use pre-built version
    config.module = config.module || {};
    config.module.noParse = config.module.noParse || [];
    if (Array.isArray(config.module.noParse)) {
      config.module.noParse.push(/mapbox-gl/);
    }

    return config;
  },
};

export default nextConfig;
