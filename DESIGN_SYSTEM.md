# Lentes Pura Vida design system

Source of truth for how the site looks. Code lives in `src/styles/` (one entry, `site.css`, imports in this order):
`tokens.css` (all values) → `fonts.css` → `base.css` (reset, type, layout) → `components.css` (buttons, forms, cards...)
→ `pages.css` (page sections) → `motion.css`. Change values in `tokens.css`, not in rules.

## Fonts

| Role | Face | File | Why |
|---|---|---|---|
| Display (h1, h2) | **Fraunces Soft**: our own static cut of Fraunces (opsz 60, wght 470, SOFT 100, WONK 1) | `public/fonts/fraunces-soft-latin-470-normal.woff2`, 18 KB, preloaded | A warm "old style" serif with rounded, soft terminals that echo round frames and the script logo. The slight leaning h, m, n (WONK) gives it a hand-made feel no template font has. Reads optician-you-trust, not tech startup. Felix Gray and Pair use the same kind of soft display serif. |
| Text, UI, prices | **Figtree** (variable, 300 to 900) | `public/fonts/figtree-latin-wght-normal.woff2`, 20 KB | Clean, friendly geometric sans with open shapes; very legible at 15 to 18px on cheap phones; tabular numbers for prices. Warmer than Inter (the AI-builder default) and calmer than Instrument Sans. |

Both SIL OFL 1.1 (licenses next to the files). Latin subset only (covers á é í ó ú ñ ¿ ¡). Two files per page, 38 KB total.
`font-display: swap` with metric-matched fallbacks (`Fraunces Fallback` on Georgia, `Figtree Fallback` on Arial;
size-adjust and ascent/descent computed with capsize) so the swap does not move layout (CLS 0).
To recut the display face: `fontTools.varLib.instancer` on the Fontsource `fraunces-latin-full-normal.woff2` with the axes above.

Weights used: display 470 only (never bold, never italic, never a colored word). Figtree 400 body, 500 chips, 600 buttons, labels, h3.

## Type scale

Fluid: phone value at 390px, desktop value at 1440px, linear in between (`clamp()` in `tokens.css`).

| Token / class | Phone | Desktop | Line height | Tracking | Face | Use |
|---|---|---|---|---|---|---|
| `--fs-display` `.display` | 40 | 72 | 1.02 | -0.025em | Fraunces | Home hero h1 only |
| `--fs-h1` `h1` | 34 | 56 | 1.06 | -0.02em | Fraunces | Exactly one per page |
| `--fs-h2` `h2` | 28 | 40 | 1.12 | -0.012em | Fraunces | Opens a section |
| `--fs-h3` `h3` | 19 | 22 | 1.25 | -0.005em | Figtree 600 | Card or block title |
| `--fs-eyebrow` `.eyebrow` | 12 | 12 | 1.3 | +0.08em, uppercase | Figtree 600 | Rare, see rules |
| `--fs-body-lg` `.lead` | 18 | 20 | 1.5 | 0 | Figtree 400 | Intro under a heading |
| `--fs-body` | 17 | 18 | 1.55 | 0 | Figtree 400 | Running text (never under 16 on phones) |
| `--fs-small` `.small` | 15 | 15 | 1.45 | 0 | Figtree | Meta, help text |
| `--fs-caption` `.caption` | 13 | 13 | 1.45 | 0 | Figtree | Fine print |

Hierarchy: one `h1` per page, `h2` per section, `h3` per card. Never skip a level for looks; use the `.h2`/`.h3` classes
to change size without changing the level. Text columns max 68ch (`--measure`).

## Color roles

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--bg` | #FFFFFF | Page | |
| `--surface` | #FFFFFF | Cards, drawers, inputs | |
| `--surface-alt` | #F6F2EA | Alternate sections, summary boxes | |
| `--surface-photo` | #F2EDE4 | The warm panel every frame photo sits on | |
| `--ink` | #13162A | Headings, body, icons | 17.9:1 on white |
| `--ink-muted` | #4F5263 | Secondary text | 7.7:1 white, 6.6:1 photo |
| `--ink-subtle` | #6B6D7C | Captions on white or surface-alt only | 5.1:1 white, 4.6:1 alt |
| `--line` | #E6E0D6 | Hairlines, card borders (decorative) | |
| `--line-strong` | #8C8373 | Input and control borders | 3.7:1 (UI 3:1) |
| `--brand` | #06633C | The logo green: primary buttons, selected states, focus ring | 7.4:1 on white |
| `--brand-hover` / `--brand-press` | #054E2F / #043D25 | Primary hover / pressed | |
| `--brand-ink` | #FFFFFF | Text on brand | 7.4:1 |
| `--brand-tint` | #EBF3EE | Selected card background | |
| `--accent` | #B8913A | Stars and tiny marks only, never text | decorative |
| `--accent-ink` | #8A6A1F | Accent as text, if ever needed | 5.1:1 |
| `--success` / `--warn` / `--error` | #1D6B45 / #8A5300 / #A63A22 | Status text and borders | all ≥ 5.4:1 on alt |
| `--focus` | #06633C (white on the green band) | 2px focus ring, 3px offset | |

The green band (`.band`) is the only full-color block, at most one per page. WhatsApp green (#25D366) lives only inside the
WhatsApp glyph, never as a button fill.

## Buttons

| Class | Look | When |
|---|---|---|
| `.btn-primary` | Filled brand green, white text | The one main action on the screen: Agregar al carrito, Cotizar, Confirmar pedido, Ver los modelos in the hero. **One per screen.** Never two side by side. |
| `.btn-secondary` | 1.5px ink outline | Next to or below a primary; any WhatsApp button that is not the screen's main action. |
| `.btn-tertiary` | Ink text, underline that tightens and turns green on hover | Everything else: "Ver el proceso completo", "Editar", inline navigation. |

- Sizes: `.btn-sm` 44px (header, sticky bar), default (`.btn-md`) 52px phone / 48px desktop, `.btn-lg` 58px (checkout submit).
- Width: `.btn-block` full width always; `.btn-block-phone` full width under 768px.
- States: hover (darker fill or tinted outline, soft shadow on primary), `:focus-visible` (2px ring, 3px offset),
  `:active` (pressed color, scale 0.98), `:disabled` or `aria-disabled="true"` (45% opacity, no pointer),
  `.is-loading` or `aria-busy="true"` (label hidden, width kept, spinner).
- On the green band the colors flip by themselves (white primary, white outline); no extra class.
- Minimum touch target 44 × 44 everywhere (tertiary links included).
- `QuoteButton.astro`: `variant="primary|secondary|tertiary"` (default secondary), `size="sm|md|lg"`, `block` or `block="phone"`,
  `primary` marks the page's main button for the sticky bar. Keeps `data-wa` and the ref-code hooks.
- Button text: sentence case, no letter-spacing, verb first, no emoji.

## Other components (components.css)

Form fields (`.field`, 52px, 1.5px `--line-strong` border, green focus halo, `aria-invalid` red), radio cards
(`.choice-card`, `.opt-card`), checkbox rows (`.opt-check`), pill radios (`.pill`), chips (`.chip`, ink fill when active),
badges (`.badge`, `.badge--brand`, `.badge--ink`; normal case, never a row of them), product card (`.card`),
panel (`.panel`, `.panel--alt`), price (`.price`, `.price-amount`, `.price-note`, `.price-compare`), rating (`.rating`,
`.stars`), color dots and swatches (`.dot`, `.swatch` 40px + ring = 50px target), accordion (`.faq-item` on native
details/summary), breadcrumb (`.crumbs`), quantity (`.qty`).

## Spacing and grid

- Space scale (4px base): `--space-3xs` 4, `2xs` 8, `xs` 12, `s` 16, `m` 24, `l` 32, `xl` 48, `2xl` 64, `3xl` 96, `4xl` 128.
- Section padding `--section-y`: 56 phone → 112 desktop. Heading block to content `--stack`: 24 → 44.
- Container `.wrap`: 1200px content plus gutters. Gutters `--gutter`: 20 (390), 32 (768), 40 (1280+).
- Page grid `.cols`: 4 columns phone, 8 tablet, 12 desktop; gap 16 / 24. Children span with `style="--span: 6"`.
- Breakpoints: 768 (tablet), 1024 (desktop layout), 1280 (wide grid). Design phone first, check 390 / 768 / 1440.
- Radius: `--radius-sm` 6, `--radius-md` 10 (buttons, inputs, photos), `--radius-lg` 16 (panels), `--radius-pill`.
- Shadows: `--shadow-sm` (resting), `--shadow-md` (hover lift), `--shadow-lg` (drawer, flying photo).

## Motion

- Tokens: `--dur-1` 120ms (press), `--dur-2` 200ms (hover), `--dur-3` 320ms (drawers, folds), `--dur-4` 600ms (reveals);
  `--ease-out` for most things, `--ease-spring` for small confirmations (cart badge, checkmarks).
- Reveal: `data-reveal` (rises 18px and fades in once) or `data-reveal="stagger"` (children one after another, 60ms apart).
  BaseLayout's single IntersectionObserver handles it and also tags common blocks (section heads, grids, steps, FAQ).
  Hidden only under `html.js.reveal` (added by that script after it marks what is already on screen), so no JS means no
  hiding and the first screen never waits.
- Hover lift: `.lift` (and product cards) rise 4px with `--shadow-md` on hover-capable screens, press to 0.985 on tap.
- Only `opacity` and `transform` animate. No layout shift, no scroll-jacking, no autoplaying carousels or marquees.
- `prefers-reduced-motion: reduce` switches off every transition, animation, reveal and view transition.

## Do

- One primary button per screen; WhatsApp is secondary unless it is the main action.
- Show the frames big on the warm photo panel; let photos and whitespace do the work.
- Give every section its own layout for its own job (a comparison is a table, steps are a sequence, reviews are quotes).
- Left-align body text; center only short, single-purpose blocks (the band, the confirmation).
- Keep copy in usted, plain Costa Rican Spanish, "lentes" (never "armazón"), frame price only.

## Don't (the "avoid" list: these read as templated or AI-built)

- Gold or colored italic word inside headlines.
- Spaced-out uppercase pill labels above every heading (the eyebrow is for one or two places per page, not a rhythm).
- Icon-in-a-box triplets; emoji bullets.
- Scrolling marquees or tickers; floating WhatsApp bubbles.
- Dark glowing hero; full dark pages.
- The same eyebrow → title → lead → 3 cards rhythm in every section.
- Centered everything; generic stock layouts.
- Long dashes in copy; fixed dollar prices in OG/meta/ad lines.
- New fonts, weights or colors outside this file without updating it.
