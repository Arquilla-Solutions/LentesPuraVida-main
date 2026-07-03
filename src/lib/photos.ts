// Build-time photo scanner for `public/Glasses/`.
//
// Each frame lives under `public/Glasses/{Frame Name}/`. Colors are either
// subdirectories (the common case, e.g. `Bandon/Black (Bandon)/`) or, for a
// single-color frame like Potter, files sit at the root of the frame folder
// and the color is parsed out of the filename.
//
// Each color has up to 5 views: front / side / top / on man / on woman.
//
// products.ts stores colors in Spanish; folders are in English. The
// SPANISH_TO_ENGLISH dictionary below is the bridge — kept in this file so
// there's exactly one place to edit when a new color shows up.

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const GLASSES_DIR = "public/Glasses";

const VIEW_KEYS = ["front", "side", "top", "onMan", "onWoman"] as const;
export type View = (typeof VIEW_KEYS)[number];

export interface ColorPhotos {
  /** The exact color folder name on disk (e.g. "Black (Bandon)"). */
  folderName: string;
  /** The color-only part of the folder name (e.g. "Black"). */
  colorEn: string;
  /** Public URLs for each available view. Not every color has all views. */
  photos: Partial<Record<View, string>>;
}

export interface FramePhotos {
  /** Ordered list of colors this frame has photos for. */
  colors: ColorPhotos[];
  /** Convenience: colorEn → ColorPhotos. Lowercased keys for tolerant lookup. */
  byColor: Record<string, ColorPhotos>;
}

/** Spanish (products.ts) → English (folder-color). Extend as new colors ship. */
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

/** Runs at build time when a page imports it. Cached per module load. */
let _cached: Record<string, FramePhotos> | null = null;

export function scanFramePhotos(): Record<string, FramePhotos> {
  if (_cached) return _cached;
  const result: Record<string, FramePhotos> = {};
  let frames: string[];
  try {
    frames = readdirSync(GLASSES_DIR).filter((d) =>
      statSync(join(GLASSES_DIR, d)).isDirectory(),
    );
  } catch {
    _cached = result;
    return result;
  }

  for (const frame of frames) {
    const framePath = join(GLASSES_DIR, frame);
    const entries = readdirSync(framePath);
    const subdirs = entries.filter((e) =>
      statSync(join(framePath, e)).isDirectory(),
    );

    let colors: ColorPhotos[];

    if (subdirs.length > 0) {
      colors = subdirs.map((sub) => {
        const files = readdirSync(join(framePath, sub)).filter((f) =>
          f.toLowerCase().endsWith(".avif"),
        );
        return {
          folderName: sub,
          colorEn: extractColorFromFolder(sub, frame),
          photos: mapPhotos(files, encodeSegments(["/", "Glasses", frame, sub])),
        };
      });
    } else {
      // Single-color frame like Potter — files sit at the root, color in filename.
      const files = entries.filter((f) => f.toLowerCase().endsWith(".avif"));
      const grouped: Record<string, string[]> = {};
      for (const f of files) {
        const color = extractColorFromFilename(f, frame);
        (grouped[color] ??= []).push(f);
      }
      colors = Object.entries(grouped).map(([color, files]) => ({
        folderName: color,
        colorEn: color,
        photos: mapPhotos(files, encodeSegments(["/", "Glasses", frame])),
      }));
    }

    const byColor: Record<string, ColorPhotos> = {};
    for (const c of colors) byColor[c.colorEn.toLowerCase()] = c;

    result[frame] = { colors, byColor };
  }

  _cached = result;
  return result;
}

/** Look up a Spanish color name → ColorPhotos in a frame, or null. */
export function findColorPhotos(
  frame: FramePhotos | undefined,
  spanishColor: string,
): ColorPhotos | null {
  if (!frame) return null;
  const englishKey = SPANISH_TO_ENGLISH[spanishColor.toLowerCase()];
  if (englishKey && frame.byColor[englishKey]) return frame.byColor[englishKey];
  // Best-effort fallback: try the raw Spanish key in case the folder happens to match.
  if (frame.byColor[spanishColor.toLowerCase()]) return frame.byColor[spanishColor.toLowerCase()];
  return null;
}

/** Reverse of SPANISH_TO_ENGLISH — used to label folder colors back into Spanish for display. */
export const ENGLISH_TO_SPANISH: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [es, en] of Object.entries(SPANISH_TO_ENGLISH)) {
    // Capitalize the Spanish label the way products.ts does ("Negro", "Azul marino").
    out[en] = es[0].toUpperCase() + es.slice(1);
  }
  return out;
})();

/**
 * Truth-source list of colors for a frame: only the ones actually photographed.
 * Falls back to the English folder name if we don't have a Spanish translation
 * (better to show something than to hide the color).
 */
export function photographedColors(
  frame: FramePhotos | undefined,
): Array<{ spanish: string; english: string; photos: ColorPhotos["photos"] }> {
  if (!frame) return [];
  return frame.colors.map((c) => {
    const key = c.colorEn.toLowerCase();
    const spanish = ENGLISH_TO_SPANISH[key] ?? c.colorEn;
    return { spanish, english: c.colorEn, photos: c.photos };
  });
}

/** Get the primary "card thumbnail" for a frame — first color's front view. */
export function primaryThumb(frame: FramePhotos | undefined): string | null {
  if (!frame || frame.colors.length === 0) return null;
  const first = frame.colors[0];
  return first.photos.front ?? first.photos.side ?? first.photos.top ?? null;
}

function extractColorFromFolder(sub: string, frame: string): string {
  // "Color (Frame)" pattern
  const parenMatch = sub.match(/^(.+?)\s*\(.+\)$/);
  if (parenMatch) return parenMatch[1].trim();
  // "Frame Color" pattern (case-insensitive)
  if (sub.toLowerCase().startsWith(frame.toLowerCase() + " ")) {
    return sub.slice(frame.length + 1).trim();
  }
  return sub.trim();
}

function extractColorFromFilename(f: string, frame: string): string {
  // "Potter Matte Black - front.avif" → "Matte Black"
  const stripped = f.replace(/\.avif$/i, "");
  const withoutView = stripped
    .replace(/\s*-\s*(front|side|top|on\s*man|on\s*woman)\s*$/i, "")
    .trim();
  if (withoutView.toLowerCase().startsWith(frame.toLowerCase() + " ")) {
    return withoutView.slice(frame.length + 1).trim();
  }
  return withoutView;
}

function mapPhotos(
  files: string[],
  baseUrl: string,
): Partial<Record<View, string>> {
  const out: Partial<Record<View, string>> = {};
  for (const f of files) {
    const lower = f.toLowerCase();
    const url = `${baseUrl}/${encodeURIComponent(f)}`;
    if (/\s-\s*on\s*woman/.test(lower)) out.onWoman = url;
    else if (/\s-\s*on\s*man/.test(lower)) out.onMan = url;
    else if (/\s-\s*side/.test(lower)) out.side = url;
    else if (/\s-\s*top/.test(lower)) out.top = url;
    else if (/\s-\s*front/.test(lower)) out.front = url;
  }
  return out;
}

/** URL-encode each path segment; the leading "/" stays literal. */
function encodeSegments(parts: string[]): string {
  const [first, ...rest] = parts;
  return first + rest.map((p) => encodeURIComponent(p)).join("/");
}
