import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Vercel compatibility: Lightning CSS disabled via NEXT_DISABLE_LIGHTNINGCSS=1 env var
  // Tailwind v4 uses @tailwindcss/postcss which has its own CSS processing

  // TypeScript configuration
  typescript: {
    // Allow TypeScript warnings during build (don't fail on type errors)
    // This is useful during development and migration phases
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    // Allow ESLint warnings during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
