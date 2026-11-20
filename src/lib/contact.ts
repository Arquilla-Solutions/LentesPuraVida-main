// The one place the WhatsApp number lives. Replace the placeholder with the real
// number before going live: digits only, country code first (Costa Rica = 506).
export const WHATSAPP_NUMBER = "1XXXXXXXXXX";
export const WHATSAPP_DISPLAY = "+1-XXX-XXX-XXXX";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

// Lead bridge (GHL_BACKEND_PLAN.md, phase 2). Leave empty until the Cloudflare
// function exists. When set, every quote tap also sends
// { ref, frame, color, page, placement, utm_*, fbclid, gclid } to this URL.
export const LEAD_ENDPOINT = "";
