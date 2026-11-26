// Trust phrases shared by the home trust strip, the product page fold and the footer,
// so the wording never drifts. Icons are lucide names for astro-icon.
export interface TrustItem { icon: string; text: string }

export const TRUST: TrustItem[] = [
  { icon: "lucide:award", text: "Hechos en EE.UU." },
  { icon: "lucide:map-pin", text: "Envío a las 7 provincias" },
  { icon: "lucide:shield-check", text: "Garantía de fábrica" },
  { icon: "lucide:smartphone", text: "Pago por SINPE Móvil o transferencia" },
];

// Store rating. The home trust strip shows it and BaseLayout puts the same numbers in the
// site-wide JSON-LD, so what visitors see always matches what search engines read.
export const STORE_RATING = { score: 4.9, count: 127 };

/** 4.9 -> "4,9", 4.83 -> "4,83" (Costa Rican decimal comma). */
export const ratingText = (score: number) => score.toLocaleString("es-CR", { maximumFractionDigits: 2 });

// The fit promise: what we check before ordering and how we stay with the customer after.
// No return window is promised. Shown on home, the product page and /envios-y-garantia.
export const FIT = [
  "Antes de pedirlos, revisamos con usted la receta, el color y la talla.",
  "Le acompañamos por WhatsApp hasta que sus lentes le queden bien.",
];

// Said next to the shipping copy (shipping page, product fold, order confirmation).
// "Guía rastreable" stays where it already is.
export const SHIP_NOTICE = "Le avisamos cuando esté en camino.";

// Free shipping on orders of this total or more (FAQ "envío gratis en pedidos de $300 o más").
// The cart bar measures frames only, and says lenses also count toward the total.
export const FREE_SHIP = 300;
