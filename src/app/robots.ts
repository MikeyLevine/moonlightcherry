import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

// NSFW media pages are excluded per-item via `generateMetadata`'s robots
// directive (a URL-pattern disallow here can't see the nsfw flag) — see
// src/app/i/[id]/page.tsx. This just keeps authenticated/private
// surfaces out of crawl entirely.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/settings",
        "/messages",
        "/notifications",
        "/auth",
        "/api",
        "/login",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
