import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
const isProductionDeployment = process.env.VERCEL_ENV === "production";
const shouldEnforceCsp = process.env.ENABLE_CSP_ENFORCE === "true";

function getSecurityHeaders() {
  const connectSources = ["'self'"];
  const imageSources = ["'self'", "data:", "blob:"];

  if (supabaseHostname) {
    connectSources.push(`https://${supabaseHostname}`);
    imageSources.push(`https://${supabaseHostname}`);
  }

  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src ${imageSources.join(" ")}`,
    `connect-src ${connectSources.join(" ")}`,
    "frame-src 'none'",
    "upgrade-insecure-requests",
  ];

  const headers = [
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), interest-cohort=()",
    },
    {
      key: shouldEnforceCsp
        ? "Content-Security-Policy"
        : "Content-Security-Policy-Report-Only",
      value: cspDirectives.join("; "),
    },
  ];

  if (isProductionDeployment) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
    });
  }

  return headers;
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: getSecurityHeaders(),
        source: "/:path*",
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    qualities: [75, 92, 95],
    remotePatterns: supabaseHostname
      ? [
          {
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/product-images/**",
            protocol: "https",
          },
        ]
      : [],
  },
};

export default nextConfig;
