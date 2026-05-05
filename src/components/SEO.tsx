import { Helmet } from "react-helmet-async";
import {
  DEFAULT_OG_IMAGE,
  SITE_LANG,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo";

interface SEOProps {
  title: string;
  description: string;
  /** Path or absolute URL. If omitted, no canonical is emitted (rare — pages should set this). */
  canonical?: string;
  /** Path or absolute URL. Defaults to the site OG image. */
  image?: string;
  imageAlt?: string;
  /** Open Graph type — "website" for landing/marketing, "product" for catalog items, "article" for posts. */
  ogType?: "website" | "product" | "article";
  /** Set to true on 404 / utility pages so they don't pollute the index. */
  noIndex?: boolean;
  /** Optional keywords meta. Modern engines mostly ignore this, but it doesn't hurt for niche markets. */
  keywords?: string;
  /** Pass JSON-LD objects (Product, FAQPage, BreadcrumbList, etc.). They will be serialized as <script> tags. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SEO = ({
  title,
  description,
  canonical,
  image,
  imageAlt,
  ogType = "website",
  noIndex = false,
  keywords,
  jsonLd,
}: SEOProps) => {
  const canonicalUrl = canonical ? absoluteUrl(canonical) : undefined;
  const imageUrl = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;
  const robots = noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1";
  const jsonLdArray = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
    : [];

  return (
    <Helmet>
      <html lang={SITE_LANG} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {canonicalUrl && <link rel="alternate" hrefLang="es-CR" href={canonicalUrl} />}
      {canonicalUrl && <link rel="alternate" hrefLang="es" href={canonicalUrl} />}
      {canonicalUrl && <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={SITE_LOCALE} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}

      {/* Geo — repeated per page so SERP CTR boosters survive even without index.html crawl */}
      <meta name="geo.region" content="CR" />
      <meta name="geo.placename" content="Costa Rica" />

      {jsonLdArray.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
};

export { SITE_URL };
export default SEO;
