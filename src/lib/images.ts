// Responsive images: every photo becomes AVIF + WebP at a few widths.
import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";

export interface ResponsiveImage {
  avif: string;
  webp: string;
  src: string;
  width: number;
  height: number;
}

export async function responsive(
  img: ImageMetadata,
  widths: number[] = [320, 480, 640],
): Promise<ResponsiveImage> {
  // Never upscale: keep the widths below the original, plus the original
  // (or the largest requested width when the original is bigger).
  const max = Math.max(...widths);
  const ws = [...new Set([...widths.filter((w) => w < img.width), Math.min(img.width, max)])].sort(
    (a, b) => a - b,
  );
  const [avif, webp] = await Promise.all([
    getImage({ src: img, widths: ws, format: "avif", quality: 60 }),
    getImage({ src: img, widths: ws, format: "webp", quality: 74 }),
  ]);
  return {
    avif: avif.srcSet.attribute,
    webp: webp.srcSet.attribute,
    src: webp.src,
    width: img.width,
    height: img.height,
  };
}

/** A JPEG for social share previews (Facebook and WhatsApp do not read AVIF). */
export async function shareJpeg(img: ImageMetadata): Promise<string> {
  const out = await getImage({ src: img, width: Math.min(img.width, 1200), format: "jpg", quality: 82 });
  return out.src;
}
