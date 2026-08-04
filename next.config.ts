import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.cookiebot.com https://unpkg.com https://*.lottie.host https://lottie.host https://cdn.jsdelivr.net; connect-src 'self' http://localhost:3001 ws://localhost:3001 https://challenges.cloudflare.com https://nominatim.openstreetmap.org https://*.cookiebot.com https://*.lottie.host https://lottie.host https://unpkg.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https://ik.imagekit.io https://*.openstreetmap.org https://*.cookiebot.com https://api.dicebear.com https://*.supabase.co https://images.unsplash.com https://hoirqrkdgbmvpwutwuwj.supabase.co https://upload.wikimedia.org https://*.wikimedia.org https://ssl.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.cookiebot.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://challenges.cloudflare.com https://*.cookiebot.com https://*.lottie.host https://lottie.host;",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      { protocol: 'https', hostname: 'ssl.gstatic.com' },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
