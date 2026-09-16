import type { NextConfig } from "next";

// Cloudflare Turnstile is wired up but disabled until real keys are set
// (src/lib/security/turnstile.ts) — its script/frame hosts are allowed here
// unconditionally so enabling it later doesn't also require a CSP change.
// Turbopack's dev-mode HMR client needs 'unsafe-eval'; production builds don't.
const scriptSrc = ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"];
if (process.env.NODE_ENV !== "production") scriptSrc.push("'unsafe-eval'");

const CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://cdn.discordapp.com https://lh3.googleusercontent.com",
  `script-src ${scriptSrc.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  process.env.NODE_ENV !== "production" ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Lets the dev server accept requests from other devices on the LAN,
  // via the real dev subdomain used to satisfy OAuth redirect-URI domain
  // requirements during local development.
  allowedDevOrigins: ["192.168.0.248", "dev.moonlightcherry.xyz"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
