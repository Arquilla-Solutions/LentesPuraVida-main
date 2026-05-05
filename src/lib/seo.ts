// Site-wide SEO constants. Update SITE_URL when the custom domain is wired up
// (e.g. https://lentespuravida.cr) — every canonical/OG URL is derived from this.

export const SITE_URL = "https://lentespuravida.com";
export const SITE_NAME = "Lentes Pura Vida";
export const SITE_LOCALE = "es_CR";
export const SITE_LANG = "es-CR";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const BRAND_LOGO = `${SITE_URL}/favicon.png`;

// All seven Costa Rican provinces — used in LocalBusiness `areaServed` so
// search engines associate the brand with national coverage instead of just
// "Costa Rica" as a single label.
export const CR_PROVINCES = [
  "San José",
  "Alajuela",
  "Cartago",
  "Heredia",
  "Guanacaste",
  "Puntarenas",
  "Limón",
] as const;

export const absoluteUrl = (path: string): string => {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
