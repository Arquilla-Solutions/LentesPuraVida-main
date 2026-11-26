// Catalog helpers shared by the home, the catalog pages and the product pages.
import { products as allProducts, type Product } from "@/data/products";
import { photographedColors, scanFramePhotos } from "./photos";

const framePhotos = scanFramePhotos();

/** Frames with photos. Frames without a photo folder stay hidden everywhere. */
export const visibleProducts: Product[] = allProducts.filter(
  (p) => framePhotos[p.name]?.colors.length,
);

export type CategoryId = "mujer" | "hombre" | "unisex" | "ninos";

export interface Category {
  id: CategoryId;
  label: string;
  path: string;
  title: string;
  h1: string;
  intro: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "mujer",
    label: "Mujer",
    path: "/lentes/mujer",
    title: "Lentes recetados para mujer en Costa Rica | Lentes Pura Vida",
    h1: "Lentes recetados para mujer",
    intro:
      "Monturas de plástico y metal en formas clásicas y modernas. Escoja la que le guste y le cotizamos los lentes según su receta.",
    description:
      "Lentes recetados para mujer, hasta 60% menos que en la óptica, con envío a toda Costa Rica. Escoja el modelo y le cotizamos los lentes según su receta.",
  },
  {
    id: "hombre",
    label: "Hombre",
    path: "/lentes/hombre",
    title: "Lentes recetados para hombre en Costa Rica | Lentes Pura Vida",
    h1: "Lentes recetados para hombre",
    intro:
      "Monturas sobrias y livianas para usar todos los días. Escoja la que le guste y le cotizamos los lentes según su receta.",
    description:
      "Lentes recetados para hombre, hasta 60% menos que en la óptica, con envío a toda Costa Rica. Escoja el modelo y le cotizamos los lentes según su receta.",
  },
  {
    id: "unisex",
    label: "Unisex",
    path: "/lentes/unisex",
    title: "Lentes recetados unisex en Costa Rica | Lentes Pura Vida",
    h1: "Lentes recetados unisex",
    intro:
      "Modelos que se ven bien en cualquier cara. Escoja el suyo y le cotizamos los lentes según su receta.",
    description:
      "Lentes recetados unisex, hasta 60% menos que en la óptica, con envío a toda Costa Rica. Escoja el modelo y le cotizamos los lentes según su receta.",
  },
  {
    id: "ninos",
    label: "Niños",
    path: "/lentes/ninos",
    title: "Lentes recetados para niños en Costa Rica | Lentes Pura Vida",
    h1: "Lentes recetados para niños",
    intro:
      "Monturas resistentes y livianas para los más pequeños de la casa.",
    description:
      "Lentes recetados para niños con envío a toda Costa Rica. Escríbanos por WhatsApp y le ayudamos a escoger la montura y cotizar los lentes.",
  },
];

/** Same category rules as the original site. */
export const productCategories = (p: Product): CategoryId[] => {
  if (p.kids) return ["ninos"];
  const cats: CategoryId[] = [];
  if (p.gender === "Hombre / Mujer") cats.push("unisex", "hombre");
  if (p.gender === "Hombre / Mujer" || p.gender === "Mujer") cats.push("mujer");
  return cats;
};

export const productsIn = (id: CategoryId) =>
  visibleProducts.filter((p) => productCategories(p).includes(id));

/** The frame (and English color folder) that represents each category in photo tiles
 * (home "Busque por estilo", phone menu). Missing ones fall back to the category's first frame. */
export const CATEGORY_FRAME: Partial<Record<CategoryId, { frame: string; color: string }>> = {
  mujer: { frame: "District", color: "matte pink" },
  hombre: { frame: "Warren", color: "matte navy" },
  unisex: { frame: "Delaware", color: "tortoise" },
};

/** Categories that have at least one visible frame. Empty ones (Niños while Bound has no photos) stay out of menus. */
export const activeCategories = () => CATEGORIES.filter((c) => productsIn(c.id).length > 0);

export const categoryLabel = (p: Product) =>
  p.kids ? "Niños" : p.gender === "Mujer" ? "Mujer" : "Unisex";

/** Simple shape groups for the catalog filter. */
export const shapeGroup = (shape: string) => {
  const s = shape.toLowerCase();
  if (s.startsWith("redondo") || s === "ovalado") return "Redondos";
  if (s === "cuadrado") return "Cuadrados";
  return "Rectangulares";
};

/** Frames with a known rating first, then the rest in spreadsheet order. */
export const featuredProducts = (n: number) =>
  [...visibleProducts]
    .sort((a, b) => (b.rating ? 1 : 0) - (a.rating ? 1 : 0))
    .slice(0, n);

export const modelCount = visibleProducts.length;

/** Material groups for the catalog filter ("Mixto (plástico y metal)" counts as metal). */
export const materialGroup = (material: string) => (material.startsWith("Mixto") ? "Metal" : material);

/** Color families for the catalog filter, from the Spanish color names of the photographed colors.
 * Order matters: "Gris transparente" is a clear frame, "Negro y blanco" a black one. */
const COLOR_FAMILIES: Array<{ id: string; label: string; test: RegExp; sw: string }> = [
  { id: "negro", label: "Negro", test: /^negro/i, sw: "#16161a" },
  { id: "carey", label: "Carey y café", test: /^(carey|marr|beige)/i, sw: "linear-gradient(135deg,#7a3f1a 0%,#3a1a0a 50%,#a86b3a 100%)" },
  { id: "transparente", label: "Transparente y blanco", test: /^(transparente|gris transparente|blanco)/i, sw: "linear-gradient(135deg,#f0eee9 0%,#d4cfc4 100%)" },
  { id: "gris", label: "Gris", test: /^gris/i, sw: "#6c6e7a" },
  { id: "azul", label: "Azul", test: /^azul/i, sw: "#2f4f86" },
  { id: "verde", label: "Verde", test: /^(verde|menta)/i, sw: "#3f6b4a" },
  { id: "rosa", label: "Rosa y rojo", test: /^(rosa|rojo|borgo|floral)/i, sw: "#c4607a" },
  { id: "amarillo", label: "Amarillo y naranja", test: /^(amarillo|naranja)/i, sw: "#e2b24f" },
];

export const colorFamily = (spanish: string) => COLOR_FAMILIES.find((f) => f.test.test(spanish));

/** Families present in a list of products, in the fixed order above, with how many frames have each. */
export const colorFamiliesIn = (list: Product[]) => {
  const ids = new Map<string, number>();
  for (const p of list) for (const id of productFamilies(p)) ids.set(id, (ids.get(id) ?? 0) + 1);
  return COLOR_FAMILIES.filter((f) => ids.has(f.id)).map((f) => ({ id: f.id, label: f.label, sw: f.sw, count: ids.get(f.id)! }));
};

/** Family ids of a frame's photographed colors (only colors the site actually shows). */
export const productFamilies = (p: Product) => {
  const out = new Set<string>();
  for (const c of photographedColors(framePhotos[p.name])) {
    const f = colorFamily(c.spanish);
    if (f) out.add(f.id);
  }
  return [...out];
};

/** URL-safe value for a filter option ("Rectangulares" -> "rectangulares", "Plástico" -> "plastico"). */
export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
