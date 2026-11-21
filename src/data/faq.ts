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
    a: "Necesita una receta de un optometrista u oftalmólogo. Hágase el examen de la vista donde usted confíe. Después escriba la receta al confirmar el pedido o mándenos una foto por WhatsApp. Si nos manda el recibo del examen, le rebajamos hasta $10.",
  },
  precio: {
    id: "precio",
    q: "¿El precio de la montura incluye los lentes graduados?",
    a: "No. Los $30 o $45 son solo de la montura. Los lentes graduados dependen de su receta y de los extras que escoja. Con su receta le mandamos el precio total por WhatsApp el mismo día, sin paquetes cerrados.",
  },
  envio: {
    id: "envio",
    q: "¿Hacen envíos a todo Costa Rica?",
    a: `Sí. Enviamos a las 7 provincias: ${provinces}. Despachamos desde el laboratorio en EE.UU. con guía rastreable y su pedido llega en 10 a 14 días hábiles a su casa, oficina o sucursal de Correos de Costa Rica.`,
  },
  pago: {
    id: "pago",
    q: "¿Cómo pago desde Costa Rica?",
    a: "Con SINPE Móvil o transferencia bancaria en colones. Antes de cobrarle le confirmamos la receta, el color, la talla y el monto. Todo queda por escrito en su chat de WhatsApp.",
  },
  defecto: {
    id: "defecto",
    q: "¿Qué pasa si los lentes llegan con un defecto?",
    a: "Tiene garantía de fábrica. Si la montura o los lentes llegan con un defecto de fabricación, se los reemplazamos sin costo. Y antes de pedirlos revisamos con usted la talla y la receta.",
  },
  tipos: {
    id: "tipos",
    q: "¿Hacen progresivos, bifocales o con filtro de luz azul?",
    a: "Sí. Hacemos monofocales, bifocales y progresivos. Los extras son opcionales: antirreflejo, filtro de luz azul y fotocromáticos (se oscurecen con el sol). Le cotizamos cada combinación antes de pedirla. <a href=\"/lentes-y-tratamientos\">Vea para qué sirve cada uno</a>.",
  },
  fabrica: {
    id: "fabrica",
    q: "¿Quién fabrica los lentes?",
    a: "Un laboratorio óptico certificado en Estados Unidos, con optómetras de licencia profesional. Cada par se hace con su receta exacta y pasa controles de calidad antes del envío.",
  },
  foto: {
    id: "foto",
    q: "¿Cómo le tomo la foto a la receta?",
    a: "Con buena luz, sobre una mesa, con toda la hoja a la vista y sin reflejos. Que se lean bien los números de cada ojo (OD es el derecho y OI el izquierdo). Si tiene dudas, mándela igual y le confirmamos. También puede escribir los números al confirmar el pedido.",
  },
  talla: {
    id: "talla",
    q: "¿Cómo sé si la montura me va a quedar?",
    a: "Vea por dentro de la patilla de sus lentes actuales: traen tres números, por ejemplo 52-18-140 (lente, puente y patilla, en milímetros). Compárelos con las medidas de cada modelo. Si están a 2 mm o menos, le va a quedar parecido. Si no los encuentra, mándenos una foto y le ayudamos.",
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
