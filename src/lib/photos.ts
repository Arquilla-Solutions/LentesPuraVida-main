// Frame photo library, read at build time from `src/assets/Glasses/`.
//
// HOW TO SWAP IN NEW PHOTOS (no code changes):
//   src/assets/Glasses/{Frame}/{Color folder}/{Frame Color - View}.{avif|jpg|jpeg|png|webp}
//   e.g. src/assets/Glasses/November/Black (November)/November Black - Front.jpg
// View is the text after the last " - ": Front, Side, Top, On Man, On Woman.
// A single-color frame may keep its files directly in the frame folder; the color
// is then read from the file name ("Potter Matte Black - Front.avif").
// Replace a file with one of the same name (any of the extensions above) and rebuild.
// Astro turns every photo into AVIF + WebP at several widths, so originals can be
// large phone shots; bigger originals give sharper desktop images.
//
// products.ts stores colors in Spanish; folders are in English. SPANISH_TO_ENGLISH
// is the bridge, kept here so there is one place to edit when a new color shows up.

import type { ImageMetadata } from "astro";

const FILES = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/Glasses/**/*.{avif,AVIF,jpg,JPG,jpeg,JPEG,png,PNG,webp,WEBP}",
  { eager: true },
);

export const VIEW_KEYS = ["front", "onWoman", "onMan", "side", "top"] as const;
export type View = (typeof VIEW_KEYS)[number];

/** Product shots (frame alone on a plain background) vs. photos of a person. */
export const isProductView = (v: View) => v === "front" || v === "side" || v === "top";

export interface ColorPhotos {
  /** The exact color folder name on disk (e.g. "Black (Bandon)"). */
  folderName: string;
  /** The color-only part of the folder name (e.g. "Black"). */
  colorEn: string;
  /** Image metadata for each available view. Not every color has all views. */
  photos: Partial<Record<View, ImageMetadata>>;
}

export interface FramePhotos {
  colors: ColorPhotos[];
  /** colorEn (lowercase) to ColorPhotos. */
  byColor: Record<string, ColorPhotos>;
}

/** Spanish (products.ts) to English (folder color). Extend as new colors ship. */
export const SPANISH_TO_ENGLISH: Record<string, string> = {
  "amarillo": "yellow",
  "azul": "blue",
  "azul claro": "light blue",
  "azul marino": "navy",
  "azul marino mate": "matte navy",
  "azul mate": "matte blue",
  "azul transparente": "clear blue",
  "beige mate": "matte beige",
  "blanco": "white",
  "blanco esmerilado": "frosted white",
  "blanco mate": "matte white",
  "borgoña": "burgundy",
  "borgoña mate": "matte burgundy",
  "carey": "tortoise",
  "carey mate": "matte tortoise",
  "clear gray": "clear gray",
  "floral": "floral",
  "floral mate": "matte floral",
  "gris": "gray",
  "gris mate": "matte gray",
  "marrón": "brown",
  "marrón claro": "light brown",
  "marrón mate": "matte brown",
  "marrón transparente": "brown clear",
  "menta": "mint",
  "naranja": "orange",
  "negro": "black",
  "negro mate": "matte black",
  "negro y blanco": "black & white",
  "negro y marrón": "black & brown",
  "rojo": "red",
  "rojo y floral": "red & floral",
  "rosa": "pink",
  "rosa mate": "matte pink",
  "rosa neón": "neon pink",
  "transparente": "clear",
  "transparente esmerilado": "frosted clear",
  "transparente mate": "matte clear",
  "verde": "green",
  "verde azulado": "teal",
  "verde mate": "matte green",
  "verde oliva": "olive green",
};

export const ENGLISH_TO_SPANISH: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [es, en] of Object.entries(SPANISH_TO_ENGLISH)) {
    out[en] = es[0].toUpperCase() + es.slice(1);
  }
  // Folder names with no Spanish twin in products.ts, or with a typo on disk.
  out["clear gray"] = "Gris transparente";
  out["matte tortiose"] = "Carey mate";
  return out;
})();

let _cached: Record<string, FramePhotos> | null = null;

export function scanFramePhotos(): Record<string, FramePhotos> {
  if (_cached) return _cached;
  // frame -> colorKey -> ColorPhotos (Map keeps sorted insertion order)
  const tree = new Map<string, Map<string, ColorPhotos>>();

  for (const path of Object.keys(FILES).sort()) {
    const parts = path.split("/Glasses/")[1]?.split("/") ?? [];
    if (parts.length < 2) continue;
    const frame = parts[0];
    const file = parts[parts.length - 1];
    const view = viewFromFilename(file);
    if (!view) continue;

    let folderName: string;
    let colorEn: string;
    if (parts.length >= 3) {
      folderName = parts[1];
      colorEn = extractColorFromFolder(folderName, frame);
    } else {
      colorEn = extractColorFromFilename(file, frame);
      folderName = colorEn;
    }

    if (!tree.has(frame)) tree.set(frame, new Map());
    const colors = tree.get(frame)!;
    const key = colorEn.toLowerCase();
    if (!colors.has(key)) colors.set(key, { folderName, colorEn, photos: {} });
    colors.get(key)!.photos[view] = FILES[path].default;
  }

  const result: Record<string, FramePhotos> = {};
  for (const [frame, colors] of tree) {
    const list = [...colors.values()].filter((c) => Object.keys(c.photos).length > 0);
    const byColor: Record<string, ColorPhotos> = {};
    for (const c of list) byColor[c.colorEn.toLowerCase()] = c;
    result[frame] = { colors: list, byColor };
  }
  _cached = result;
  return result;
}

/** Colors actually photographed, labelled in Spanish (falls back to the English name). */
export function photographedColors(
  frame: FramePhotos | undefined,
): Array<{ spanish: string; english: string; photos: ColorPhotos["photos"] }> {
  if (!frame) return [];
  return frame.colors.map((c) => ({
    spanish: ENGLISH_TO_SPANISH[c.colorEn.toLowerCase()] ?? c.colorEn,
    english: c.colorEn,
    photos: c.photos,
  }));
}

/** Card thumbnail: first color's front view. */
export function primaryThumb(frame: FramePhotos | undefined): ImageMetadata | null {
  const p = frame?.colors[0]?.photos;
  return p?.front ?? p?.side ?? p?.top ?? null;
}

/** First on-face photo of a frame, preferring the given person. */
export function onFaceThumb(
  frame: FramePhotos | undefined,
  prefer: "onWoman" | "onMan" = "onWoman",
): ImageMetadata | null {
  if (!frame) return null;
  const other = prefer === "onWoman" ? "onMan" : "onWoman";
  for (const c of frame.colors) if (c.photos[prefer]) return c.photos[prefer]!;
  for (const c of frame.colors) if (c.photos[other]) return c.photos[other]!;
  return null;
}

function viewFromFilename(f: string): View | null {
  const m = f.replace(/\.[a-z]+$/i, "").match(/\s-\s*(front|side|top|on\s*man|on\s*woman)\s*$/i);
  if (!m) return null;
  const v = m[1].toLowerCase().replace(/\s+/g, "");
  return v === "onman" ? "onMan" : v === "onwoman" ? "onWoman" : (v as View);
}

function extractColorFromFolder(sub: string, frame: string): string {
  const parenMatch = sub.match(/^(.+?)\s*\(.+\)$/);
  if (parenMatch) return parenMatch[1].trim();
  if (sub.toLowerCase().startsWith(frame.toLowerCase() + " ")) {
    return sub.slice(frame.length + 1).trim();
  }
  return sub.trim();
}

function extractColorFromFilename(f: string, frame: string): string {
  const withoutView = f
    .replace(/\.[a-z]+$/i, "")
    .replace(/\s*-\s*(front|side|top|on\s*man|on\s*woman)\s*$/i, "")
    .trim();
  if (withoutView.toLowerCase().startsWith(frame.toLowerCase() + " ")) {
    return withoutView.slice(frame.length + 1).trim();
  }
  return withoutView;
}
