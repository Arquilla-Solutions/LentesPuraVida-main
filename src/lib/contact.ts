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
// This is Cloudflare's invisible TEST key: it only works with the TEST secret in .dev.vars.
// Before going live, replace it with the real site key (order-board SETUP.md, step 3).
export const TURNSTILE_SITE_KEY = "1x00000000000000000000BB";
