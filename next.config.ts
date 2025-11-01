import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Vercel compatibility: Lightning CSS disabled via NEXT_DISABLE_LIGHTNINGCSS=1 env var
  // Tailwind v4 uses @tailwindcss/postcss which has its own CSS processing

  // Disable Lightning CSS on production builds (Vercel)
  experimental: {
    ...(process.env.VERCEL && {
      cssChunking: 'loose',
    }),
  },
};

export default nextConfig;
