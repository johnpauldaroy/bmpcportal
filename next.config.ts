import type { NextConfig } from "next";

const scriptSrc =
  process.env.NODE_ENV === "production"
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src ${scriptSrc}; connect-src 'self' https://*.supabase.co https://*.supabase.in https://openrouter.ai; form-action 'self'`
          }
        ]
      },
      {
        source: "/(member|admin)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store"
          }
        ]
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store"
          }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co"
      }
    ]
  }
};

export default nextConfig;
