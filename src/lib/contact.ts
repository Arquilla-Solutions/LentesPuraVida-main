// The one place the WhatsApp number lives (real Lentes Pura Vida number, set 2026-11-20).
// Digits only, country code first (Costa Rica = 506).
export const WHATSAPP_NUMBER = "50670030553";
export const WHATSAPP_DISPLAY = "+506 7003 0553";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

// Checkout orders are saved to the order board (Pages Function functions/api/order.ts,
// D1 database lentes_orders). Same site only. WhatsApp opens even if this fails.
export const LEAD_ENDPOINT = "/api/order";

// Quote taps (the "Cotizar por WhatsApp" links) are NOT sent to the order board.
// Leave empty unless a separate lead endpoint exists.
export const QUOTE_LEAD_ENDPOINT = "";

// Cloudflare Turnstile site key (public by design) for the checkout bot check.
// Real widget "Lentes checkout" (hostnames lentespuravida.com and www.lentespuravida.com).
// It does not run on localhost or pages.dev; locally the test secret in .dev.vars accepts any token.
export const TURNSTILE_SITE_KEY = "0x4AAAAAAGToILnqb02P0HY0";
