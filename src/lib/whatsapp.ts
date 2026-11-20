// Pre-written WhatsApp messages. Every quote button is an <a data-wa> link whose
// href already works with no JavaScript. On tap, the script in BaseLayout adds a
// reference code (and the ad source, when the visit came from a tagged link) so
// each conversation can be matched to the frame and the ad that produced it.
import { WHATSAPP_NUMBER } from "./contact";

export const waHref = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const quoteMessage = (frame?: string, color?: string) =>
  frame
    ? `Hola, me interesan los lentes ${frame}${color ? ` en color ${color}` : ""}. ¿Me ayudan a cotizarlos?`
    : "Hola, quiero cotizar unos lentes recetados.";

export const MESSAGES = {
  general: quoteMessage(),
  noRx: "Hola, quiero unos lentes pero no tengo receta. ¿Cómo hago?",
  lensHelp: "Hola, tengo una consulta sobre qué tipo de lentes me conviene.",
  kids: "Hola, busco lentes recetados para un niño o niña. ¿Qué opciones tienen?",
} as const;
