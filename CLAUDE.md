# CLAUDE.md — project memory for Lentes Pura Vida

> Auto-loaded into every Claude Code session. Keep terse. Update when assumptions change.

> ⚠️ **Stack migrated to Astro 2026-07-02.** Most of this file below the "Current stack" section is pre-migration history — retained because the design system, hard rules, and business context are still accurate. Anything about routing (`react-helmet-async`, `useEffect`, React Router, Vite HMR), file locations (`src/pages/Index.tsx`, `src/components/SiteHeader.tsx`), or the deploy pipeline (auto-deploy on push, `keep-it-real-now.pages.dev`) below is **stale** — read the "Current stack" section for what's actually true. Auto-memory `lentes_pura_vida.md` has the latest session state.

## Current stack (as of 2026-07-03)

- **What:** Lentes Pura Vida — Costa Rica e-commerce for prescription eyewear (frames + RX lens quotes via WhatsApp). Sebastian's own business, not an Arquilla client.
- **Stack:** Astro 7 static build, TypeScript, custom CSS (no Tailwind, no shadcn). `astro-icon` + `@iconify-json/lucide` for icons.
- **Repo:** `https://github.com/Arquilla-Solutions/LentesPuraVida-main` · branch `main`
- **Local:** `~/Desktop/LentesPuraVida-main`. Legacy Vite/React source preserved under `_legacy-vite/` for reference — don't touch unless doing archaeology.
- **Routes (file-based):** `/` (home + catalog) · `/sobre-nosotros` · `/lentes/[slug]` (28 static product pages via `getStaticPaths` — 4 slugs hidden until photos land) · `/404`.
- **Live:** <https://lentespuravida.com> served by Cloudflare Pages. **CF project name is `lentespuravida`** (not `keep-it-real-now`).
- **Deploy path:** CF Pages GitHub integration was broken as of the migration and never reconnected. Deploys go through `npm run deploy` (wrangler CLI, authed on Sebastian's Mac). Same command rebuilds + uploads to CF Pages under `--branch=main` (production).
- **Product images:** Self-hosted under `public/Glasses/{Frame}/{Color folder}/{Frame Color - View}.avif`. Five views per color: Front, Side, Top, On man, On woman. Scanned at build time by `src/lib/photos.ts`. **NEVER hotlink `img.ebdcdn.com` or mention the supplier anywhere public-facing.**
- **Key files:** `src/pages/index.astro` (home), `src/pages/lentes/[slug].astro` (product template), `src/pages/sobre-nosotros.astro` (about), `src/pages/404.astro`, `src/components/Header.astro` + `Footer.astro` + `WhatsAppButton.astro`, `src/layouts/BaseLayout.astro` (head + SEO + JSON-LD org/website), `src/lib/photos.ts` (photo scanner + color dictionary), `src/data/products.ts` (32 products — auto-generated from spreadsheet, still the source of metadata but colors are folder-derived at render time), `src/styles/catalogo.css` (home + about, ~2100 lines), `src/styles/november.css` (product page, ~1500 lines including the nv2 v2 refresh block at the bottom).

**Skip the rest of this file when you're just picking up work.** It's pre-migration. Read the auto-memory instead.

---

## HISTORICAL — pre-Astro-migration context below

## Old project-at-a-glance (kept for backfill, do not treat as current)

- **What:** Lentes Pura Vida — Costa Rica e-commerce for prescription eyewear (frames + RX lens quotes via WhatsApp).
- **Stack:** Vite 5 + React 18 + TypeScript + Tailwind + shadcn (mostly unused). React Router (BrowserRouter). Lucide for icons.
- **Hosted:** Cloudflare Pages, auto-deploys on push to `main` (~30s end-to-end). Live: <https://lentespuravida.com> (custom domain) — `keep-it-real-now.pages.dev` is the underlying Pages URL.
- **Repo:** `https://github.com/Arquilla-Solutions/keep-it-real-now` · branch `main`
- **Local:** `~/Downloads/keep-it-real-now-main` (was a Lovable zip; now a real git clone)
- **Routes:** `/` (catalog) · `/sobre-nosotros` (about) · `/lentes/:slug` (product detail, 32 frames) · `*` (NotFound)

## Business model — read this before touching copy

These rules drove a lot of design decisions. Violating them (especially #1) creates customer-facing dishonesty.

1. **Frame prices ($30 or $45) are FRAME ONLY.** Lenses are quoted by WhatsApp per-prescription. Never write "lentes graduados incluidos" or "el precio incluye lentes" — that contradicts the model and we corrected this everywhere already. Use language like "Cotización transparente · Pagás el armazón a precio fijo. Lentes graduados se cotizan según tu receta — sin paquetes cerrados."
2. **Tiered comparison pricing**: $30 frames compare against `$80+` óptica local, $45 frames against `$110+`. The bad price renders red + strikethrough; savings render in a gold pill.
3. **WhatsApp is the only conversion channel.** No cart, no checkout, no email signup. Every CTA goes to `wa.me` with a pre-filled Spanish message. Number is still placeholder `1XXXXXXXXXX` in `src/lib/contact.ts` — **remind user to replace before launch**.
4. **Audience: Costa Rica, Spanish-speaking.** Voice: warm, direct, CR-focused. Not corporate. Trust signals matter heavily — CR shoppers are wary of buying online. Hammer on: SINPE Móvil / made in EE.UU. / certified optometrists / cliente verificado / WhatsApp service.
5. **Cloudflare Pages allows commercial use; Vercel free tier doesn't.** Don't suggest Vercel.

## Single source of truth: products.ts

`src/data/products.ts` is **auto-generated** from the spreadsheet at `~/Downloads/catalogo_lentes_pura_vida.xlsx`. Generator scripts live at `/tmp/gen_products.py` + `/tmp/json_to_ts.py` (could move to `scripts/` if the data shape locks in).

- 32 products. Fields: `slug, name, img, alt, desc, framePrice, comparePrice, material, shape, rim, weight, sizes[], primarySize, colors[], features[], rating, gender, kids`.
- Plus `COLOR_SWATCHES` map (45 colors → CSS bg/ring) and `FALLBACK_SWATCH` for unknowns.
- Plus `PRODUCT_PAGES: Record<name, url>` consumed by Index for catalog cards.
- **Index.tsx + ProductPage.tsx both read from this file.** Don't reintroduce inline product data in pages.

## Category filter rule (Index.tsx)

```ts
const matchesCategory = (p: Product, cat: Category): boolean => {
  if (p.kids) return cat === "ninos";          // kids ONLY in Niños
  if (cat === "ninos") return false;
  if (cat === "unisex")  return p.gender === "Hombre / Mujer";
  if (cat === "hombres") return p.gender === "Hombre / Mujer";
  if (cat === "mujeres") return p.gender === "Hombre / Mujer" || p.gender === "Mujer";
  return false;
};
```

Counts: Unisex 28 · Hombres 28 · Mujeres 31 · Niños 1.

## File map (only what matters)

| Path | Role |
|---|---|
| `src/pages/Index.tsx` | Home: announcement bar → topnav → hero → value strip → trust banner → "cómo funciona" → reviews marquee → catalog grid → footer |
| `src/pages/ProductPage.tsx` | Generic template for all 32 frames. Reads `:slug`, looks up via `findBySlug`, renders. Has its own `.nov-nav` (slim back-arrow nav) and `.nov-sticky-cta` mobile bar |
| `src/pages/AboutUs.tsx` | "Nuestra misión" page. Uses home's topnav + announcement bar |
| `src/pages/NotFound.tsx` | 404 |
| `src/components/SiteFooter.tsx` | Shared on all pages: 4-col on desktop, 1-col on mobile. Brand block, Catálogo links, Atención (no business hours — e-commerce only), Pago seguro chips, Garantías list |
| `src/data/products.ts` | Single source of truth (generated) |
| `src/lib/contact.ts` | WhatsApp number — **placeholder, update before launch** |
| `src/styles/catalogo.css` | Home + AboutUs + footer + announcement bar (~1900 lines) |
| `src/styles/november.css` | Product detail page (~1100 lines; named after first prototype) |
| `public/_redirects` | `/* /index.html 200` — required for Cloudflare Pages SPA routing |
| `public/favicon.png` | NOT updated to match new logo yet — TODO |
| `src/assets/logo.png` | Toucan brand mark, 195KB (was 1.25MB pre-tinypng). Includes wordmark + URL baked in — text becomes unreadable below ~50px size, user accepted this. Could split into `logo-mark.png` (toucan only) for small uses later |

## Design system

- **Palette:** `--navy #13162a` / `--gold #c9a84c` (lt `#e8c97a`, dk `#a8892e`) / `--cream #faf7f1` / `--text #17192e` / `--cat-muted #6a6c85`
- **Trust colors:** green `#1f7a4d` for "Pago seguro" pills (CR shoppers care about payment safety). Red `#c83232` for bad-price strikethrough comparisons.
- **Font:** Inter (preconnected from Google Fonts in `index.html`)
- **Icons:** Lucide React. No emojis except 🇨🇷 (Costa Rica flag) and the announcement bar's icons. We deliberately removed all decorative emojis throughout.
- **Animations:**
  - Gold sweep behind navy bars (announcement bar, hero, footer, final CTAs) — `@keyframes annc-sweep` / `nov-sweep` / `site-footer-sweep`
  - Pulsing gold dot in hero/section eyebrows — `@keyframes hero-eyebrow-pulse` / `nov-pulse`
  - Floating credentials medallions on home hero (Award / 4.9★) — `@keyframes hero-float`
  - IntersectionObserver-driven `[data-reveal]` fade-up on ProductPage and AboutUs sections
  - All animations respect `@media (prefers-reduced-motion: reduce)`
- **Buttons:** Home hero CTAs are gold-on-navy (`.btn-primary`, `.btn-outline`). Subpage CTAs are navy-on-cream (`.nov-cta-primary` etc.). The colors are inverted intentionally because the backgrounds invert.
- **Section patterns:** eyebrow chip (gold uppercase, sometimes with pulsing dot) → big italic-gold-accent title → muted lead paragraph → content. Maintain this rhythm.

## Workflow rules

1. **Single source of truth = GitHub.** Lovable is OFF (user is canceling subscription, saving ~$290/yr). Don't suggest pushing through Lovable.
2. **At session start:** verify we're in a git repo, on main, and remind user to `git pull` if they haven't.
3. **At session end:** if the user asks to commit/push, run `git add -A`, write a descriptive multi-line message, push to `main`. Cloudflare auto-deploys.
4. **Commit messages:** multi-line, focus on the *why* and grouping changes. Always include the trailer:
   `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
5. **Never:** force push to main, skip hooks (`--no-verify`), `--amend`, or commit without explicit ask. The user has been burned by parallel work on the remote — be careful with destructive ops.
6. **Build:** `npm run build` (output to `dist/`). Type-check: `npx tsc -p tsconfig.app.json --noEmit`.
7. **Dev:** `npm run dev` → port 8080. Vite has HMR; CSS edits hot-reload instantly.
8. **npm cache** is root-owned on this machine — use `--cache /tmp/npm-cache-kir` if `npm install` errors with EACCES.

## Open TODOs / known placeholders

> See "Session resume context" near the bottom for the latest status. Leaving this anchor here for backwards compatibility.

## Deferred / explicitly off the table

- **Virtual try-on (Warby Parker style).** Discussed and explicitly deferred. Three paths exist: Jeeliz VTO (open source, needs 3D `.glb` per frame), commercial SDK (Banuba/Fittingbox $300–$2000/mo), or DIY MediaPipe + 2D PNG overlay (free but lower fidelity). The real bottleneck is asset cost (3D models for 32 frames, or background-removed PNGs). Revisit post-launch only.

## What the user likes / doesn't like (from past sessions)

- ✅ Navy/gold/cream palette
- ✅ Lucide icons over emojis
- ✅ Premium "trust signals everywhere" approach (CR shoppers anxious about online buying)
- ✅ Generic template + data approach over hand-built pages
- ✅ Tiered pricing comparison
- ✅ Scrolling announcement marquee for shipping/delivery info — *only* if it feels premium (slow drift, soft edge fades, hover-pause). The earlier rejection was about a *cheap-looking* ticker.
- ❌ "Lentes graduados incluidos" claim — corrected after this misled customers about pricing model
- ❌ Lovable for ongoing development (one-time bootstrap only)

When in doubt, lean **premium** + **honest** + **trust-heavy**.

## Header pattern (current, post-2026-04 refresh)

`src/components/SiteHeader.tsx` is the shared header used by Index + AboutUs (ProductPage keeps its own slim `.nov-nav`).

- **Marquee** (`.annc-marquee`): seamless infinite scroll. Items live in `MARQUEE_ITEMS` in SiteHeader.tsx. Hover-pause + reduced-motion safe.
- **Topnav** tabs: `Inicio · Catálogo · Cómo funciona · Nosotros · Contacto` + WhatsApp pill CTA. Catálogo/Cómo funciona/Contacto are anchor links (`#catalogo`, `#como-funciona`, `#contacto`).
- **Mobile drawer** (≤880px): hamburger opens a right-side panel. ESC + backdrop close. Body scroll locks while open.
- Anchor IDs to keep stable on Index: `#top`, `#catalogo`, `#como-funciona`, and `#contacto` (currently `#contacto` has no target — TODO: build a Contact section or page).

## Performance baseline

- Routes lazy-loaded except `/` (see `src/App.tsx`). Catalog home loads in the main bundle for fast first paint in CR.
- `index.html` preconnects to `img.ebdcdn.com` (product CDN), Google Fonts, and gstatic.
- Hero logo: `loading="eager"` + `fetchPriority="high"`. All other images: `loading="lazy"` + `decoding="async"` + explicit `width`/`height` to avoid CLS.
- Inter loaded with weights `400, 600, 700, 800` only — add more sparingly.

## SEO baseline (post-2026-05 overhaul — see commits `60c8c26` + `dd7aef2`)

**Per-page metadata via `react-helmet-async`** — every route now has its own title/description/canonical/OG/Twitter/robots/JSON-LD. Wired up in `src/main.tsx` via `<HelmetProvider>`.

Key files:
- `src/lib/seo.ts` — single source of truth: `SITE_URL = "https://lentespuravida.com"`, `CR_PROVINCES` (all 7), `absoluteUrl()` helper. **If the canonical domain ever changes, only this file needs editing.**
- `src/components/SEO.tsx` — reusable `<SEO>` component. Props: `title`, `description`, `canonical`, `image`, `imageAlt`, `ogType`, `noIndex`, `keywords`, `jsonLd` (single object or array).

JSON-LD shipped per page:
- **`index.html`** (site-wide): `Organization + OnlineStore + Optician` with stable `@id="...#business"`, `knowsAbout` (lens types/treatments), `areaServed` listing all 7 CR provinces (San José, Alajuela, Cartago, Heredia, Guanacaste, Puntarenas, Limón) as `AdministrativeArea`. Plus `WebSite` schema with publisher ref.
- **Index** (`src/pages/Index.tsx`): `CollectionPage` + `ItemList` (linking all products) + `FAQPage` (6 home FAQs in `HOME_FAQS` const).
- **ProductPage** (all 32 routes): `Product` (with offers, USD price, shipping rate to CR, 10–14d delivery, `InStock`, `aggregateRating` from `products.ts`) + `BreadcrumbList` + `FAQPage` (existing per-product FAQs).
- **AboutUs**: `AboutPage` + `BreadcrumbList`.
- **NotFound**: `noindex,nofollow`.

Crawler hygiene:
- `public/robots.txt`: blocks GPTBot / CCBot / Google-Extended (don't drive CR commerce traffic). Allows ClaudeBot. Sitemap directive points at `https://lentespuravida.com/sitemap.xml`.
- `public/sitemap.xml`: `<lastmod>` on every URL + `hreflang` alternates (es-CR / es / x-default) on home. Re-run when products are added/removed (regenerate from `products.ts`).

Domain (live as of 2026-05-03):
- `https://lentespuravida.com` is the canonical custom domain on Cloudflare Pages.
- `https://www.lentespuravida.com` also resolves but **no www→apex 301 redirect is set up** — user explicitly declined. Canonical tags handle ~95% of the SEO de-duplication; if rankings get split between www/apex post-launch, revisit (Cloudflare → Rules → Redirect Rules → "Redirect from WWW to root" template, set 301).
- `keep-it-real-now.pages.dev` is the underlying Pages URL (not the canonical).

## Session resume context (last update: 2026-05-03)

**Current branch state:** all SEO + domain changes merged to `main`. Cloudflare Pages auto-deploys on push to `main`.

**Critical pre-launch blockers (in priority order):**

1. **WhatsApp number** — `src/lib/contact.ts` still says `1XXXXXXXXXX`. Every CTA on the site is broken until this is real. User needs to provide number with country code (e.g. `50688881234`). One-line edit: `WHATSAPP_NUMBER` + `WHATSAPP_DISPLAY` in that file.
2. **`og-image.png` asset** — referenced in JSON-LD + every Helmet OG tag. Doesn't exist at `public/og-image.png`. Need 1200×630 PNG (navy/gold brand, toucan logo, "Lentes recetados desde $30 · Envío a toda Costa Rica"). Without it, social share previews are broken.
3. **Favicon** — `public/favicon.png` is still old generic icon (1.25 MB). Replace with toucan logo (512×512 + multi-size .ico ideal). Already referenced as `apple-touch-icon` too.

**Cloudflare side (user has done these):**
- ✅ Custom domain `lentespuravida.com` + `www` both added to Pages project, both Proxied via Cloudflare DNS (CNAME → `lentespuravida.pages.dev`).
- ❌ User declined: www→apex 301 redirect rule.
- ❓ Unknown if user toggled: SSL/TLS → "Always Use HTTPS" + "Full (strict)" mode. **First action when user resumes: ask if these are on.**
- ❓ Unknown if user set: build settings (Framework=Vite, Build cmd=`npm run build`, Output=`dist`).

**Trust/content backlog (post-launch but high-leverage):**
- Replace placeholder reviews (Andrés/María/Jorge) repeated on all 32 product pages with real per-product reviews — duplicate content risk.
- Self-host product photos under `public/products/{slug}-front.jpg` (currently hotlinking `img.ebdcdn.com`).
- Real `aggregateRating` count (currently hardcoded 4.9/127 in index.html LocalBusiness schema).
- Provincial coverage testimonials (one per CR province minimum).
- Legal pages: cédula jurídica, términos y condiciones, política de privacidad — required for CR e-commerce trust + GDPR-ish + Google E-E-A-T.

**SEO follow-ups (require user action):**
- Verify domain in Google Search Console + Bing Webmaster Tools. User will get a verification meta tag string — drop into `index.html` `<head>` when ready.
- Submit `sitemap.xml` to GSC after verification.
- Register Google Business Profile (free, drives Maps + branded SERP even for online-only).
- Add CR backlinks: r/costarica, TicoTimes, La Nación lifestyle, Mercado Libre seller link.
- Populate `sameAs` array in `index.html` LocalBusiness schema once social handles exist (Instagram / Facebook / TikTok).

**Visual changes I proposed and user is "considering" (don't implement without explicit go-ahead):**
1. Per-product real reviews replacing the 3 generic ones.
2. "Envío a todo Costa Rica" 7-province grid above the footer on home.
3. Contact section/page (currently `#contacto` anchor in nav has no target).
4. Blog/guides section (CR long-tail SEO unlock — "Cómo leer tu receta de lentes", "Mono vs progresivo", etc.).
5. Visible breadcrumb UI on product pages (JSON-LD already has it, just not rendered).

**Open TODOs / known placeholders (carried over):**

- [ ] Replace WhatsApp placeholder number in `src/lib/contact.ts` ← **biggest blocker**
- [ ] Generate `public/og-image.png` (1200×630, navy/gold brand)
- [ ] Update `public/favicon.png` to toucan logo
- [ ] Replace generic 3-card reviews on every product page with real reviews
- [ ] Replace `img.ebdcdn.com` hotlinks with `public/products/` self-hosted photos
- [ ] Optional: split logo into `logo.png` (full) + `logo-mark.png` (toucan only)
- [ ] Optional: move `gen_products.py` + `json_to_ts.py` from `/tmp/` to `scripts/`
