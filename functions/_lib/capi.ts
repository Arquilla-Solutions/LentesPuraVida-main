// Meta Conversions API: one server-side Lead per new order, matched to the browser Pixel's Lead
// by event_name + event_id (the LPV order code). Only device signals go to Meta: IP, browser,
// and the _fbp/_fbc cookies. Never name, phone, province, canton, receta or hashed PII.
// Every failure is swallowed: this can never change the order answer.
import type { Env } from "./env.ts";
import type { CleanOrder } from "./validate.ts";
import { META_PIXEL_ID as BROWSER_PIXEL_ID } from "../../src/lib/tracking.ts";

export const META_PIXEL_ID = BROWSER_PIXEL_ID;
const GRAPH = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`;
const TIMEOUT_MS = 4000;

export interface LeadEvent {
  event_name: "Lead";
  event_time: number;
  event_id: string;
  action_source: "website";
  event_source_url: string;
  user_data: { client_ip_address?: string; client_user_agent?: string; fbp?: string; fbc?: string };
  custom_data: { content_ids: string[]; content_type: "product"; num_items: number; value: number; currency: "USD" };
}

const CTRL = /[\u0000-\u001f\u007f]/;

function cookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return undefined;
}

/** Loose check for Meta's fb.<n>.<ts>.<id> cookie values. */
const fbCookie = (v: string | undefined) => (v && v.startsWith("fb.") && v.length <= 256 && !CTRL.test(v) ? v : undefined);

/** Always a URL on the request's own host; the client only picks the path. */
function sourceUrl(order: CleanOrder, request: Request): string {
  const host = new URL(request.url).host;
  const base = `https://${host}`;
  for (const p of [order.utm.landing, order.page, "/checkout"]) {
    if (!p || !p.startsWith("/") || p.startsWith("//") || p.includes("\\") || CTRL.test(p)) continue;
    try {
      const u = new URL(p, base);
      if (u.host === host) return `${base}${u.pathname}`;
    } catch {}
  }
  return `${base}/checkout`;
}

/** Pure: builds the Lead event. custom_data mirrors cartParams() in src/lib/tracking.ts. */
export function buildLeadEvent(order: CleanOrder, request: Request, now = Date.now()): LeadEvent {
  const h = request.headers;
  const user_data: LeadEvent["user_data"] = {};
  const ip = (h.get("CF-Connecting-IP") ?? "").trim();
  if (ip && ip.length <= 64 && !CTRL.test(ip)) user_data.client_ip_address = ip;
  const ua = (h.get("User-Agent") ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 512);
  if (ua) user_data.client_user_agent = ua;
  const cookies = h.get("Cookie");
  const fbp = fbCookie(cookie(cookies, "_fbp"));
  if (fbp) user_data.fbp = fbp;
  let fbc = fbCookie(cookie(cookies, "_fbc"));
  if (!fbc && /^[A-Za-z0-9_-]{1,120}$/.test(order.utm.fbclid)) fbc = `fb.1.${now}.${order.utm.fbclid}`;
  if (fbc) user_data.fbc = fbc;
  return {
    event_name: "Lead",
    event_time: Math.floor(now / 1000),
    event_id: order.ref,
    action_source: "website",
    event_source_url: sourceUrl(order, request),
    user_data,
    custom_data: {
      content_ids: order.items.map((i) => i.slug),
      content_type: "product",
      num_items: order.items.reduce((n, i) => n + i.qty, 0),
      value: order.frame_subtotal,
      currency: "USD",
    },
  };
}

/** Sends one event. Resolves either way; never throws, never logs the token or the payload. */
export async function sendLead(env: Env, event: LeadEvent, fetchImpl: typeof fetch = fetch, timeoutMs = TIMEOUT_MS): Promise<void> {
  const token = env.META_CAPI_TOKEN;
  if (!token) return;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const body: Record<string, unknown> = { data: [event], access_token: token };
    if (env.META_TEST_EVENT_CODE) body.test_event_code = env.META_TEST_EVENT_CODE;
    const res = await fetchImpl(GRAPH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    if (!res.ok) {
      console.warn(`capi lead failed status=${res.status}`);
      return;
    }
    const out = (await res.json().catch(() => ({}))) as { events_received?: number };
    console.log(`capi lead ok events_received=${Number(out.events_received) || 0} ref=${event.event_id}`);
  } catch (e) {
    console.warn(`capi lead failed status=${ctl.signal.aborted ? "timeout" : "error"}`);
  } finally {
    clearTimeout(timer);
  }
}
