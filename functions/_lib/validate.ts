// Strict checks for everything that reaches the database. Unknown fields are refused at every
// level. Prices come from the catalog, never from the browser.
import { EXTRAS, LENSES, PAYMENTS, PROVINCES, RX } from "../../src/lib/store.ts";
import { findBySlug } from "../../src/data/products.ts";

export const STATUSES = ["no_pagado", "pagado", "pedido_ebd", "en_camino", "llego", "entregado", "cancelado"] as const;
export type Status = (typeof STATUSES)[number];

export class Invalid extends Error {}
const bad = (why: string): never => { throw new Invalid(why); };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const onlyKeys = (o: Record<string, unknown>, allowed: readonly string[], where: string) => {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) bad(`unknown field ${where}.${k}`);
};
// No control characters or angle brackets in any stored text.
const CLEAN = /^[^\u0000-\u001f\u007f<>]*$/u;
const text = (v: unknown, where: string, max: number, min = 0): string => {
  if (typeof v !== "string") bad(`${where} must be text`);
  const s = (v as string).normalize("NFC").trim();
  if (s.length < min || s.length > max) bad(`${where} length`);
  if (!CLEAN.test(s)) bad(`${where} characters`);
  return s;
};
const optText = (v: unknown, where: string, max: number) => (v == null ? "" : text(v, where, max));

const REF = /^LPV-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4,6}$/;
const NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,79}$/u;
const COLOR = /^[\p{L}\p{M}\p{N} ()/.-]{1,40}$/u;

/** "+506 8888 8888", "88888888", "506-8888-8888" -> "+50688888888". Costa Rican mobiles and lines only. */
export function normalizePhone(v: unknown): string {
  if (typeof v !== "string" || v.length > 24 || !/^[+\d\s().-]+$/.test(v)) bad("whatsapp format");
  const d = (v as string).replace(/\D/g, "").replace(/^506(?=\d{8}$)/, "");
  if (!/^[245678]\d{7}$/.test(d)) bad("whatsapp format");
  return `+506${d}`;
}

const inList = (v: unknown, list: readonly number[], where: string) => {
  if (typeof v !== "number" || !list.some((x) => Math.abs(x - v) < 1e-9)) bad(`${where} value`);
  return v as number;
};

export interface RxEye { sph: number; cyl: number; axis: number | null; add: number | null }
export interface RxTyped { od: RxEye; oi: RxEye; pd: { single: number } | { right: number; left: number } | null }

function rxEye(v: unknown, where: string): RxEye {
  if (!isObj(v)) bad(`${where} missing`);
  const e = v as Record<string, unknown>;
  onlyKeys(e, ["sph", "cyl", "axis", "add"], where);
  const sph = inList(e.sph, RX.sph, `${where}.sph`);
  const cyl = inList(e.cyl, RX.cyl, `${where}.cyl`);
  let axis: number | null = null;
  if (cyl !== 0) axis = inList(e.axis, RX.axis, `${where}.axis`);
  else if (e.axis != null) bad(`${where}.axis without cyl`);
  const add = e.add == null ? null : inList(e.add, RX.add, `${where}.add`);
  return { sph, cyl, axis, add };
}

export function validateRx(v: unknown, where = "rx"): RxTyped {
  if (!isObj(v)) bad(`${where} missing`);
  const r = v as Record<string, unknown>;
  onlyKeys(r, ["od", "oi", "pd"], where);
  let pd: RxTyped["pd"] = null;
  if (r.pd != null) {
    if (!isObj(r.pd)) bad(`${where}.pd`);
    const p = r.pd as Record<string, unknown>;
    if ("single" in p) { onlyKeys(p, ["single"], `${where}.pd`); pd = { single: inList(p.single, RX.pd, `${where}.pd.single`) }; }
    else {
      onlyKeys(p, ["right", "left"], `${where}.pd`);
      pd = { right: inList(p.right, RX.pdHalf, `${where}.pd.right`), left: inList(p.left, RX.pdHalf, `${where}.pd.left`) };
    }
  }
  return { od: rxEye(r.od, `${where}.od`), oi: rxEye(r.oi, `${where}.oi`), pd };
}

export type RxMode = "typed" | "whatsapp" | "none";
/** A pair with its own receta (reading glasses, a pair for someone else). */
export interface RxOverride { prescription: RxMode; rx: RxTyped | null; for: string }
const FOR = /^[\p{L}\p{M}\p{N} .,'()-]*$/u; // keep in step with the checkout's filter

function rxOverride(v: unknown, where: string): RxOverride {
  if (!isObj(v)) bad(where);
  const o = v as Record<string, unknown>;
  onlyKeys(o, ["prescription", "rx", "for"], where);
  if (o.prescription !== "typed" && o.prescription !== "whatsapp" && o.prescription !== "none") bad(`${where}.prescription`);
  let rx: RxTyped | null = null;
  if (o.prescription === "typed") rx = validateRx(o.rx, `${where}.rx`);
  else if (o.rx != null) bad(`${where}.rx only with typed prescription`);
  const who = optText(o.for, `${where}.for`, 40).replace(/\s+/g, " ");
  if (!FOR.test(who)) bad(`${where}.for characters`);
  return { prescription: o.prescription as RxMode, rx, for: who };
}

export interface CleanItem {
  slug: string; frame: string; color: string; lens: string; extras: string[]; qty: number; frame_price: number;
  rx_override: RxOverride | null; // null = uses the order's receta
}
export interface CleanOrder {
  ref: string; name: string; whatsapp: string; province: string; canton: string;
  prescription: "typed" | "whatsapp" | "none"; rx: RxTyped | null; payment: string;
  items: CleanItem[]; frame_subtotal: number; page: string; turnstile: string;
  utm: Record<(typeof UTM_KEYS)[number], string>;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "landing"] as const;
const ORDER_KEYS = [
  "type", "ref", "ts", "name", "whatsapp", "province", "canton", "prescription", "rx", "payment",
  "frame_subtotal", "items", "page", "turnstile", ...UTM_KEYS,
] as const;
const ITEM_KEYS = ["frame", "slug", "color", "lens", "extras", "qty", "frame_price", "rx_override"] as const;
const LENS_IDS = LENSES.map((l) => l.id as string);
const EXTRA_IDS = EXTRAS.map((e) => e.id as string);
const PAY_LABELS = PAYMENTS.map((p) => p.label as string);

function item(v: unknown, n: number): CleanItem {
  const where = `items[${n}]`;
  if (!isObj(v)) bad(where);
  const i = v as Record<string, unknown>;
  onlyKeys(i, ITEM_KEYS, where);
  if (typeof i.slug !== "string" || !/^[a-z0-9-]{1,40}$/.test(i.slug)) bad(`${where}.slug`);
  const product = findBySlug(i.slug as string) ?? bad(`${where}.slug unknown`);
  const color = text(i.color, `${where}.color`, 40, 1);
  if (!COLOR.test(color)) bad(`${where}.color characters`);
  if (typeof i.lens !== "string" || !LENS_IDS.includes(i.lens)) bad(`${where}.lens`);
  if (!Array.isArray(i.extras) || i.extras.length > EXTRA_IDS.length) bad(`${where}.extras`);
  const extras = i.extras as unknown[];
  if (!extras.every((x) => typeof x === "string" && EXTRA_IDS.includes(x)) || new Set(extras).size !== extras.length) bad(`${where}.extras`);
  if (!Number.isInteger(i.qty) || (i.qty as number) < 1 || (i.qty as number) > 5) bad(`${where}.qty`);
  if (i.frame != null) text(i.frame, `${where}.frame`, 60);
  if (i.frame_price != null && (typeof i.frame_price !== "number" || !Number.isFinite(i.frame_price))) bad(`${where}.frame_price`);
  return {
    slug: product.slug, frame: product.name, color, lens: i.lens as string, extras: extras as string[],
    qty: i.qty as number, frame_price: product.framePrice,
    rx_override: i.rx_override == null ? null : rxOverride(i.rx_override, `${where}.rx_override`),
  };
}

/** The public checkout payload. Throws Invalid with a short reason. */
export function validateOrder(raw: unknown): CleanOrder {
  if (!isObj(raw)) bad("body must be an object");
  const o = raw as Record<string, unknown>;
  onlyKeys(o, ORDER_KEYS, "order");
  if (o.type !== "order") bad("type");
  if (typeof o.ref !== "string" || !REF.test(o.ref)) bad("ref");
  if (o.ts != null) text(o.ts, "ts", 40);
  const name = text(o.name, "name", 80, 2).replace(/\s+/g, " ");
  if (!NAME.test(name)) bad("name characters");
  const whatsapp = normalizePhone(o.whatsapp);
  if (typeof o.province !== "string" || !Object.hasOwn(PROVINCES, o.province)) bad("province");
  if (typeof o.canton !== "string" || !PROVINCES[o.province as string].includes(o.canton)) bad("canton");
  if (o.prescription !== "typed" && o.prescription !== "whatsapp" && o.prescription !== "none") bad("prescription");
  let rx: RxTyped | null = null;
  if (o.prescription === "typed") rx = validateRx(o.rx);
  else if (o.rx != null) bad("rx only with typed prescription");
  if (typeof o.payment !== "string" || !PAY_LABELS.includes(o.payment)) bad("payment");
  if (!Array.isArray(o.items) || o.items.length < 1 || o.items.length > 10) bad("items");
  const items = (o.items as unknown[]).map(item);
  if (items.reduce((n, i) => n + i.qty, 0) > 20) bad("too many pairs");
  if (o.frame_subtotal != null && (typeof o.frame_subtotal !== "number" || !Number.isFinite(o.frame_subtotal))) bad("frame_subtotal");
  const page = optText(o.page, "page", 100);
  if (page && !page.startsWith("/")) bad("page");
  const turnstile = optText(o.turnstile, "turnstile", 2048);
  const utm = {} as CleanOrder["utm"];
  for (const k of UTM_KEYS) utm[k] = optText(o[k], k, 120);
  return {
    ref: o.ref as string, name, whatsapp, province: o.province as string, canton: o.canton as string,
    prescription: o.prescription as CleanOrder["prescription"], rx, payment: o.payment as string, items,
    frame_subtotal: items.reduce((n, i) => n + i.frame_price * i.qty, 0), page, turnstile, utm,
  };
}

// ---------- Board edits ----------

const MONEY_FIELDS = ["quoted_total", "frame_cost", "lens_cost"] as const;
const TEXT_FIELDS = {
  name: 80, notes: 4000, ebd_order_number: 40, tracking: 200, district: 80, address_line: 300, postal_code: 12,
} as const;
export const EDITABLE = ["status", "whatsapp", "province", "canton", ...MONEY_FIELDS, ...Object.keys(TEXT_FIELDS)] as const;

/** A board edit: only the listed fields, each checked. Returns the columns to update. */
export function validatePatch(raw: unknown): Record<string, string | number | null> {
  if (!isObj(raw)) bad("body must be an object");
  const o = raw as Record<string, unknown>;
  onlyKeys(o, EDITABLE, "patch");
  const out: Record<string, string | number | null> = {};
  if ("status" in o) {
    if (typeof o.status !== "string" || !(STATUSES as readonly string[]).includes(o.status)) bad("status");
    out.status = o.status as string;
  }
  for (const k of MONEY_FIELDS) if (k in o) {
    const v = o[k];
    if (v === null || v === "") out[k] = null;
    else if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100000) out[k] = Math.round(v * 100) / 100;
    else bad(k);
  }
  for (const [k, max] of Object.entries(TEXT_FIELDS)) if (k in o) out[k] = text(o[k], k, max, k === "name" ? 2 : 0);
  if ("whatsapp" in o) out.whatsapp = normalizePhone(o.whatsapp);
  if ("province" in o || "canton" in o) {
    if (!("province" in o && "canton" in o)) bad("province and canton go together");
    if (typeof o.province !== "string" || !Object.hasOwn(PROVINCES, o.province)) bad("province");
    if (typeof o.canton !== "string" || !PROVINCES[o.province as string].includes(o.canton)) bad("canton");
    out.province = o.province as string;
    out.canton = o.canton as string;
  }
  if (!Object.keys(out).length) bad("nothing to change");
  return out;
}
