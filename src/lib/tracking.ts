// Meta Pixel (browser side). Public pages only: the board under /admin never loads this.
// Values are frame prices only (lenses are quoted later), currency USD. Never pass names,
// phones, receta, province/canton or free text: only slugs, frame names and counts.
// Every call is wrapped so a blocked or broken pixel can never stop the cart or checkout.

export const META_PIXEL_ID = "3281712312220105";
const SRC = "https://connect.facebook.net/en_US/fbevents.js";

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[][]; callMethod?: (...a: unknown[]) => void; loaded?: boolean; version?: string; push?: unknown };

/** Sets up the standard fbq queue, turns off automatic matching/config, inits, loads fbevents.js once. */
export function initPixel() {
  try {
    const w = window as any;
    if (w.__lpvPixel) return;
    w.__lpvPixel = true;
    if (!w.fbq) {
      const q: Fbq = function (...args: unknown[]) {
        q.callMethod ? q.callMethod(...args) : q.queue!.push(args);
      };
      q.queue = [];
      q.loaded = true;
      q.version = "2.0";
      q.push = q;
      w.fbq = w._fbq = q;
      const s = document.createElement("script");
      s.async = true;
      s.src = SRC;
      document.head.append(s);
    }
    w.fbq("set", "autoConfig", false, META_PIXEL_ID);
    w.fbq("init", META_PIXEL_ID);
    w.fbq("track", "PageView");
  } catch {}
}

export function track(event: string, params: Record<string, unknown> = {}, eventID?: string) {
  try {
    initPixel();
    const fbq = (window as any).fbq;
    if (typeof fbq !== "function") return;
    if (eventID) fbq("track", event, params, { eventID });
    else fbq("track", event, params);
  } catch {}
}

type Line = { slug: string; price: number; qty: number };

/** Cart-level fields shared by InitiateCheckout and Lead. */
export function cartParams(items: Line[]) {
  return {
    content_ids: items.map((i) => i.slug),
    content_type: "product",
    num_items: items.reduce((n, i) => n + i.qty, 0),
    value: items.reduce((n, i) => n + i.price * i.qty, 0),
    currency: "USD",
  };
}

/** True when /api/order saved the order: 201, or the idempotent already-saved 200 with ok:true. */
export async function orderWasSaved(res: Response): Promise<boolean> {
  if (res.status !== 201 && res.status !== 200) return false;
  try {
    const body = (await res.json()) as { ok?: unknown };
    return body.ok === true;
  } catch {
    return false;
  }
}
