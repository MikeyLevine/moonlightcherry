import type { NextConfig } from "next";

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
};

export default nextConfig;
