// Catalog helpers shared by the home, the catalog pages and the product pages.
import { products as allProducts, type Product } from "@/data/products";
import { scanFramePhotos } from "./photos";

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
