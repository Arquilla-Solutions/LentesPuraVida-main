// Sitemap built from the real pages at every build (replaces the hand-written file).
import { SITE_URL } from "@/lib/seo";
import { CATEGORIES, productsIn, visibleProducts } from "@/lib/catalog";

export const prerender = true;

export function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const pages: { path: string; priority: string; freq: string }[] = [
    { path: "/", priority: "1.0", freq: "weekly" },
    { path: "/lentes", priority: "0.9", freq: "weekly" },
    ...CATEGORIES.filter((c) => productsIn(c.id).length > 0).map((c) => ({ path: c.path, priority: "0.8", freq: "weekly" })),
    ...visibleProducts.map((p) => ({ path: `/lentes/${p.slug}`, priority: "0.8", freq: "monthly" })),
    { path: "/como-funciona", priority: "0.7", freq: "monthly" },
    { path: "/lentes-y-tratamientos", priority: "0.7", freq: "monthly" },
    { path: "/sobre-nosotros", priority: "0.6", freq: "monthly" },
    { path: "/envios-y-garantia", priority: "0.5", freq: "monthly" },
    { path: "/privacidad", priority: "0.3", freq: "yearly" },
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map((p) => `  <url><loc>${SITE_URL}${p.path === "/" ? "/" : p.path}</loc><lastmod>${today}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`)
  .join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
