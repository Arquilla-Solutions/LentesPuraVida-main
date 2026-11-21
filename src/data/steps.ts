// How ordering works, in one place. The home page, /como-funciona, every product page and
// the order confirmation all read these, so the steps never drift apart.
export interface Step { e: string; h: string; p: string }

export const STEPS: Step[] = [
  { e: "🛒", h: "Escoja y agregue al carrito", p: "Modelo, color y tipo de lente. El precio que ve es solo la montura." },
  { e: "📝", h: "Confirme con su receta", p: "Escríbala al confirmar el pedido o mándenos una foto por WhatsApp." },
  { e: "💬", h: "Le mandamos el precio total", p: "Por WhatsApp, el mismo día: montura, lentes y envío." },
  { e: "🚚", h: "Paga y se los enviamos", p: "Por SINPE Móvil o transferencia. Hacemos el pedido y le llegan a la casa." },
];

