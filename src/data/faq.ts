// Questions and answers used on the home page (short list) and on /como-funciona
// (full list). Answers may hold simple HTML links. The shipping answer keeps the
// existing "guía rastreable" wording until Sebastian confirms how shipping works.
import { CR_PROVINCES } from "@/lib/seo";

export interface FaqItem { id: string; q: string; a: string }

const provinces = `${CR_PROVINCES.slice(0, -1).join(", ")} y ${CR_PROVINCES[CR_PROVINCES.length - 1]}`;

export const FAQ: Record<string, FaqItem> = {
  receta: {
    id: "receta",
    q: "No tengo receta. ¿Qué hago?",
    a: "Necesita una receta de un optometrista u oftalmólogo. Si no tiene una reciente, hágase el examen de la vista en la óptica o clínica de su confianza y mándenos una foto de la receta por WhatsApp. Si nos manda también el recibo del examen, le rebajamos hasta $10.",
  },
  precio: {
    id: "precio",
    q: "¿El precio de la montura incluye los lentes graduados?",
    a: "No. Los precios de $30 y $45 son solo de la montura. Los lentes graduados se cotizan según su receta y los tratamientos que escoja (antirreflejo, filtro de luz azul, fotocromáticos). Mándenos la receta por WhatsApp y le enviamos el precio total el mismo día, sin paquetes cerrados.",
  },
  envio: {
    id: "envio",
    q: "¿Hacen envíos a todo Costa Rica?",
    a: `Sí. Enviamos a las 7 provincias: ${provinces}. Despachamos desde el laboratorio en EE.UU. con guía rastreable y su pedido llega en 10–14 días hábiles a su casa, oficina o sucursal de Correos de Costa Rica.`,
  },
  pago: {
    id: "pago",
    q: "¿Cómo pago desde Costa Rica?",
    a: "Con SINPE Móvil, transferencia bancaria en colones o tarjeta de crédito. Antes de cobrarle le confirmamos la receta, el color, la talla y el monto. No guardamos datos de tarjetas y todo queda por escrito en su chat de WhatsApp.",
  },
  defecto: {
    id: "defecto",
    q: "¿Qué pasa si los lentes llegan con un defecto?",
    a: "Tiene garantía de fábrica. Si la montura o los lentes llegan con un defecto de fabricación, se los reemplazamos sin costo. Antes de hacer el pedido revisamos con usted la talla y la receta para evitar errores.",
  },
  tipos: {
    id: "tipos",
    q: "¿Hacen progresivos, bifocales o con filtro de luz azul?",
    a: "Sí. Hacemos lentes monofocales, bifocales y progresivos, con tratamientos opcionales: antirreflejo, filtro de luz azul, fotocromáticos (los que se oscurecen con el sol) y protección UV. Le cotizamos cada combinación antes de hacer el pedido. <a href=\"/lentes-y-tratamientos\">Vea para qué sirve cada uno</a>.",
  },
  fabrica: {
    id: "fabrica",
    q: "¿Quién fabrica los lentes?",
    a: "Un laboratorio óptico certificado en Estados Unidos, con optómetras de licencia profesional. Cada par se hace con su receta exacta y pasa controles de calidad antes del envío.",
  },
  foto: {
    id: "foto",
    q: "¿Cómo le tomo la foto a la receta?",
    a: "Con buena luz, sobre una mesa, con toda la hoja a la vista y sin reflejos. Fíjese que se lean bien los números de cada ojo (OD es el ojo derecho y OI el izquierdo). Si tiene dudas, mándela igual y nosotros le confirmamos.",
  },
  talla: {
    id: "talla",
    q: "¿Cómo sé si la montura me va a quedar?",
    a: "Revise sus lentes actuales por dentro de la patilla: traen tres números, por ejemplo 52-18-140. Son el ancho de cada lente, el puente y el largo de la patilla, en milímetros. Compárelos con las medidas de cada modelo: si están a 2 mm o menos, le va a quedar parecido. Si no los encuentra, mándenos una foto y le ayudamos.",
  },
  dp: {
    id: "distancia-pupilar",
    q: "¿Qué es la distancia pupilar?",
    a: "Es la distancia entre el centro de una pupila y la otra, en milímetros. Se necesita para centrar bien los lentes. A veces viene en la receta; si no viene, le explicamos por WhatsApp cómo medirla en casa.",
  },
  promos: {
    id: "descuentos",
    q: "¿Tienen descuentos?",
    a: "Sí. El envío es gratis en pedidos de $300 o más, por ejemplo cuando pide lentes para varias personas de la familia. Y si nos manda el recibo de su examen de la vista, le rebajamos hasta $10.",
  },
};

export const HOME_FAQ = [FAQ.receta, FAQ.precio, FAQ.envio, FAQ.pago, FAQ.defecto];
export const ALL_FAQ = [
  FAQ.receta, FAQ.foto, FAQ.precio, FAQ.tipos, FAQ.talla, FAQ.dp,
  FAQ.pago, FAQ.envio, FAQ.defecto, FAQ.fabrica, FAQ.promos,
];

export const faqJsonLd = (items: FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a.replace(/<[^>]+>/g, "") },
  })),
});
