import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses — gzip saves 60-80% on JS bundle sizes
  compress: true,

  experimental: {
    turbopackFileSystemCacheForDev: true,
    optimizePackageImports: [
      "lucide-react",
      "@codemirror/state",
      "@codemirror/view",
      "@codemirror/commands",
      "@codemirror/language",
      "@codemirror/autocomplete",
      "@codemirror/search",
      "@codemirror/lint",
      "framer-motion",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      {
        // Required for WebContainer (SharedArrayBuffer)
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
      // Long-lived immutable cache for hashed static assets (prod only)
      ...(isProd ? [
        {
          source: "/_next/static/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
        {
          source: "/(icons|fonts)/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
          ],
        },
      ] : []),
    ];
  },
};

export default nextConfig;
