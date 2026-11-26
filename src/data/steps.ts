// How ordering works, in one place. The home page, /como-funciona, every product page and
// the order confirmation all read these, so the steps never drift apart.
export interface Step { e: string; h: string; p: string }

export const STEPS: Step[] = [
  { e: "🛒", h: "Escoja y agregue al carrito", p: "Modelo, color y tipo de lente. El precio que ve es solo la montura." },
  { e: "📝", h: "Confirme con su receta", p: "Escríbala al confirmar el pedido o mándenos una foto por WhatsApp." },
  { e: "💬", h: "Le mandamos el precio total", p: "Por WhatsApp, el mismo día: montura, lentes y envío." },
  { e: "🚚", h: "Paga y se los enviamos", p: "Por SINPE Móvil o transferencia. Hacemos el pedido y le llegan a la casa." },
];


// What happens after "Confirmar pedido". The checkout review step and /pedido-recibido both show it.
export const NEXT_STEPS: { h: string; p: string }[] = [
  { h: "Le confirmamos el precio total por WhatsApp", p: "Revisamos su receta y le mandamos el precio completo: montura, lentes, extras y envío." },
  { h: "Paga por SINPE Móvil o transferencia cuando esté de acuerdo", p: "Antes de eso no se cobra nada." },
  { h: "Pedimos sus lentes", p: "Con su receta exacta. Llegan en 10 a 14 días hábiles." },
  { h: "Le avisamos cuando esté en camino", p: "Con guía rastreable, para que sepa dónde vienen." },
];
