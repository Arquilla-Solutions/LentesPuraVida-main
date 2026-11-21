// Store options shared by the product page, the cart and the checkout (server and browser).
// Only frame prices are ever shown. Lenses and extras are quoted by WhatsApp from the
// customer's prescription, so none of these carry a price.

export const LENSES = [
  { id: "sencilla", label: "Visión sencilla", hint: "Una sola graduación, para lejos o para cerca" },
  { id: "lectura", label: "Lectura", hint: "Solo para leer, el celular o trabajos de cerca" },
  { id: "progresivos", label: "Progresivos", hint: "Lejos y cerca en el mismo lente" },
  { id: "nose", label: "No estoy seguro", hint: "Con su receta le decimos qué le conviene" },
] as const;

export const EXTRAS = [
  { id: "azul", label: "Filtro de luz azul", hint: "Para muchas horas de pantalla" },
  { id: "antirreflejo", label: "Antirreflejo", hint: "Menos reflejos de noche y en pantallas" },
  { id: "fotocromaticos", label: "Fotocromáticos", hint: "Se oscurecen solos al sol" },
  { id: "polarizados", label: "Polarizados", hint: "Lentes de sol con su graduación" },
] as const;

export type LensId = (typeof LENSES)[number]["id"];
export type ExtraId = (typeof EXTRAS)[number]["id"];

export const lensLabel = (id: string) => LENSES.find((l) => l.id === id)?.label ?? "";
export const extraLabel = (id: string) => EXTRAS.find((e) => e.id === id)?.label ?? "";

// Typed prescription: the same fields and ranges EyeBuyDirect asks for.
const steps = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
};
export const signed = (v: number) => (v === 0 ? "0.00" : `${v > 0 ? "+" : "-"}${Math.abs(v).toFixed(2)}`);
export const RX = {
  sph: steps(-20, 12, 0.25).reverse(), // +12.00 at the top, like the supplier's form
  cyl: steps(-6, 6, 0.25).reverse(),
  axis: steps(1, 180, 1),
  add: steps(0.75, 3.5, 0.25),
  pd: steps(50, 79, 1),
  pdHalf: steps(25, 40, 0.5),
};
/** Lens types that need the "Adición" value. */
export const LENSES_WITH_ADD = ["progresivos", "lectura"];

export const PAYMENTS = [
  { id: "sinpe", label: "SINPE Móvil" },
  { id: "transferencia", label: "Transferencia bancaria" },
] as const;

// Costa Rica: 7 provinces, 84 cantons (Río Cuarto 2017, Monteverde and Puerto Jiménez 2022).
export const PROVINCES: Record<string, string[]> = {
  "San José": [
    "San José", "Escazú", "Desamparados", "Puriscal", "Tarrazú", "Aserrí", "Mora", "Goicoechea", "Santa Ana",
    "Alajuelita", "Vázquez de Coronado", "Acosta", "Tibás", "Moravia", "Montes de Oca", "Turrubares", "Dota",
    "Curridabat", "Pérez Zeledón", "León Cortés",
  ],
  Alajuela: [
    "Alajuela", "San Ramón", "Grecia", "San Mateo", "Atenas", "Naranjo", "Palmares", "Poás", "Orotina", "San Carlos",
    "Zarcero", "Sarchí", "Upala", "Los Chiles", "Guatuso", "Río Cuarto",
  ],
  Cartago: ["Cartago", "Paraíso", "La Unión", "Jiménez", "Turrialba", "Alvarado", "Oreamuno", "El Guarco"],
  Heredia: [
    "Heredia", "Barva", "Santo Domingo", "Santa Bárbara", "San Rafael", "San Isidro", "Belén", "Flores", "San Pablo",
    "Sarapiquí",
  ],
  Guanacaste: [
    "Liberia", "Nicoya", "Santa Cruz", "Bagaces", "Carrillo", "Cañas", "Abangares", "Tilarán", "Nandayure", "La Cruz",
    "Hojancha",
  ],
  Puntarenas: [
    "Puntarenas", "Esparza", "Buenos Aires", "Montes de Oro", "Osa", "Quepos", "Golfito", "Coto Brus", "Parrita",
    "Corredores", "Garabito", "Monteverde", "Puerto Jiménez",
  ],
  Limón: ["Limón", "Pococí", "Siquirres", "Talamanca", "Matina", "Guácimo"],
};
