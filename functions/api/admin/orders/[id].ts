// GET /api/admin/orders/:id  the whole order (pairs, prescription, history)
// PATCH /api/admin/orders/:id  change stage or edit fields; every change is written to history.
import type { Env } from "../../../_lib/env.ts";
import { fail, json, readCapped } from "../../../_lib/http.ts";
import { Invalid, validatePatch } from "../../../_lib/validate.ts";

type Ctx = EventContext<Env, "id", { email: string }>;

const idOf = (p: string | string[]) => {
  const s = Array.isArray(p) ? p[0] : p;
  return /^\d{1,9}$/.test(s) ? Number(s) : null;
};

async function load(env: Env, id: number) {
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first<Record<string, any>>();
  if (!order) return null;
  const [items, events] = await env.DB.batch([
    env.DB.prepare("SELECT slug, frame, color, lens, extras_json, qty, frame_price FROM order_items WHERE order_id = ? ORDER BY position").bind(id),
    env.DB.prepare("SELECT at, kind, from_status, to_status, actor, detail FROM order_events WHERE order_id = ? ORDER BY at, id").bind(id),
  ]);
  order.rx = order.rx_json ? JSON.parse(order.rx_json) : null;
  delete order.rx_json;
  order.items = (items.results as any[]).map(({ extras_json, ...i }) => ({ ...i, extras: JSON.parse(extras_json) }));
  order.events = events.results;
  return order;
}

export const onRequestGet = async ({ env, params }: Ctx) => {
  const id = idOf(params.id);
  const order = id && (await load(env, id));
  return order ? json({ ok: true, order }) : fail(404, "not found");
};

const LABEL: Record<string, string> = {
  name: "nombre", whatsapp: "WhatsApp", province: "provincia", canton: "cantón", district: "distrito",
  address_line: "señas", postal_code: "código postal", quoted_total: "total cotizado", frame_cost: "costo montura",
  lens_cost: "costo lentes", notes: "notas", ebd_order_number: "número de pedido EyeBuyDirect", tracking: "rastreo",
};

export const onRequestPatch = async ({ env, params, request, data }: Ctx) => {
  const id = idOf(params.id);
  if (!id) return fail(404, "not found");
  const body = await readCapped(request, 16 * 1024);
  if (body === null) return fail(400, "too large");
  let patch;
  try { patch = validatePatch(JSON.parse(body)); } catch (e) { return fail(400, e instanceof Invalid ? e.message : "bad json"); }

  const before = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first<Record<string, any>>();
  if (!before) return fail(404, "not found");
  const changed = Object.keys(patch).filter((k) => before[k] !== patch[k]);
  if (!changed.length) return json({ ok: true, order: await load(env, id) });

  const now = new Date().toISOString();
  const sets = changed.map((k) => `${k} = ?`); // keys come from the validator's fixed list only
  const vals = changed.map((k) => patch[k]);
  if (changed.includes("status")) sets.push("status_at = ?"), vals.push(now);
  const stmts = [env.DB.prepare(`UPDATE orders SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`).bind(...vals, now, id)];
  if (changed.includes("status")) {
    stmts.push(env.DB.prepare("INSERT INTO order_events (order_id, at, kind, from_status, to_status, actor) VALUES (?, ?, 'status', ?, ?, ?)")
      .bind(id, now, before.status, patch.status, data.email));
  }
  const edits = changed.filter((k) => k !== "status");
  if (edits.length) {
    stmts.push(env.DB.prepare("INSERT INTO order_events (order_id, at, kind, actor, detail) VALUES (?, ?, 'edit', ?, ?)")
      .bind(id, now, data.email, `Cambió ${edits.map((k) => LABEL[k] ?? k).join(", ")}`));
  }
  await env.DB.batch(stmts);
  return json({ ok: true, order: await load(env, id) });
};
