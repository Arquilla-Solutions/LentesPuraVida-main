// Customer reviews shown on the home page. Kept as they were on the site
// (Sebastian's decision 2026-11-20); only their design changed.
export interface Review { quote: string; name: string; meta: string }

export const REVIEWS: Review[] = [
  { quote: "Compré los lentes de mi hijo para el regreso a clases y llegaron en tiempo récord. La calidad es buenísima y nos ahorramos casi la mitad. Volveré a pedir sin pensarlo.", name: "Carolina M.", meta: "Para su hijo · Heredia" },
  { quote: "A mis 68 años pedí mis lentes en línea por primera vez. Me ayudaron paso a paso, son cómodos y livianos. Hasta mi nieto me dice que se me ven bonitos.", name: "Doña Marta R.", meta: "Para ella · Cartago" },
  { quote: "Llevaba meses queriendo cambiar los míos pero las ópticas estaban carísimas. Aquí pagué un tercio del precio y la calidad es igual o mejor. Recomendado 100%.", name: "Diego R.", meta: "Para él · Alajuela" },
  { quote: "Le regalé unos lentes a mi esposo para su cumpleaños y quedó encantado. La atención por WhatsApp fue clarísima y todo llegó perfecto a la casa.", name: "Andrea S.", meta: "Regalo de cumpleaños · San José" },
  { quote: "Pedí los lentes de mi mamá y llegaron a su casa en San Carlos sin problema. Le encantaron y ahora todos en la familia queremos pedir los nuestros.", name: "Luis A.", meta: "Para su mamá · San Carlos" },
  { quote: "Buscaba un regalo bonito para mi hija que entró a la U y estos lentes fueron perfectos. Le encantó el modelo, se ven elegantes y le subieron la confianza. Volveremos.", name: "Patricia J.", meta: "Regalo para su hija · Escazú" },
  { quote: "Los lentes anteriores de mi niña se habían quebrado y la óptica nos cobraba un disparate. Aquí en menos de dos semanas tenía sus lentes nuevos y le quedaron lindísimos.", name: "Familia Vargas", meta: "Para su hija · Liberia" },
];
