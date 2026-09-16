/** Canonical site origin (no trailing slash) — used anywhere an absolute URL
 * is required (Open Graph, sitemap.xml, robots.txt). Falls back to the
 * production domain so a missing env var fails safe rather than emitting
 * localhost URLs into a real deploy. */
export function getSiteUrl(): string {
  return (process.env.SITE_URL ?? "https://moonlightcherry.xyz").replace(/\/$/, "");
}
