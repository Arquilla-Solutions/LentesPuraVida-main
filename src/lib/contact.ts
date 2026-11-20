// The one place the WhatsApp number lives (real Lentes Pura Vida number, set 2026-11-20).
// Digits only, country code first (Costa Rica = 506).
export const WHATSAPP_NUMBER = "50670030553";
export const WHATSAPP_DISPLAY = "+506 7003 0553";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

// Lead bridge (GHL_BACKEND_PLAN.md, phase 2). Leave empty until the Cloudflare
// function exists. When set, every quote tap also sends
// { ref, frame, color, page, placement, utm_*, fbclid, gclid } to this URL.
export const LEAD_ENDPOINT = "";
