import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Any LAN IP / Bonjour name / ngrok tunnel can open the dev server, so the
  // phone works whatever IP the router hands the Mac.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local", "*.ngrok-free.app", "*.ngrok-free.dev"],
  // The browser calls the API same-origin under /api and Next proxies it to
  // FastAPI, so no IP in .env.local and no CORS entry per network.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/api/:path*/", destination: `${BACKEND_URL}/:path*/` },
      { source: "/api/:path*", destination: `${BACKEND_URL}/:path*` },
    ];
  },
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
};

export default nextConfig;
