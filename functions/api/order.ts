// POST /api/order: the checkout saves the order here while WhatsApp opens. The customer is
// never blocked by this endpoint; the browser ignores its answer.
import type { Env } from "../_lib/env.ts";
import { fail, isJson, json, readCapped, sameOrigin } from "../_lib/http.ts";
import { sha256Hex, turnstileOk, underLimit } from "../_lib/guards.ts";
import { Invalid, validateOrder } from "../_lib/validate.ts";

const MAX_BODY = 16 * 1024;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "POST") return fail(405, "method");
  if (!sameOrigin(request)) return fail(403, "origin");
  if (!isJson(request)) return fail(415, "json only");
  if (!env.DB) return fail(503, "not configured");

  const body = await readCapped(request, MAX_BODY);
  if (body === null) return fail(400, "too large");

  // CF-Connecting-IP is set by Cloudflare on every request and cannot be faked from outside.
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const ipKey = `order:${(await sha256Hex(`${env.RATE_SALT ?? "lpv"}|${ip}`)).slice(0, 32)}`;
  const perIp = Number(env.RATE_LIMIT_ORDERS) > 0 ? Number(env.RATE_LIMIT_ORDERS) : 8;
  if (!(await underLimit(env.DB, ipKey, perIp, 600))) return fail(429, "slow down");

  let order;
  try {
    order = validateOrder(JSON.parse(body));
  } catch (e) {
    return fail(400, e instanceof Invalid ? e.message : "bad json");
  }

  // Bot check before anything touches saved orders, so nobody can ask "does LPV-XXXXX exist?"
  // without solving it. A retry of a saved order fails here (its token is spent); that is fine,
  // the order is already on the board and the browser ignores the answer.
  if (!(await turnstileOk(env.TURNSTILE_SECRET, order.turnstile, ip, new URL(request.url).hostname))) {
    return fail(403, "turnstile");
  }
  // Site-wide cap counts only checks that passed, so bots cannot use it up for real customers.
  if (!(await underLimit(env.DB, "order:all", 300, 3600))) return fail(429, "slow down");

  // Same code twice (double tap, retry) = one order. Same answer either way.
  const seen = await env.DB.prepare("SELECT 1 FROM orders WHERE ref = ?").bind(order.ref).first();
  if (seen) return json({ ok: true, ref: order.ref });

  const now = new Date().toISOString();
  const byRef = "(SELECT id FROM orders WHERE ref = ?)";
  const stmts = [
    env.DB.prepare(
      `INSERT INTO orders (ref, created_at, updated_at, status, status_at, name, whatsapp, province, canton,
         prescription, rx_json, payment_pref, frame_subtotal, page,
         utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, gclid, landing)
       VALUES (?, ?, ?, 'no_pagado', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      order.ref, now, now, now, order.name, order.whatsapp, order.province, order.canton,
      order.prescription, order.rx ? JSON.stringify(order.rx) : null, order.payment, order.frame_subtotal, order.page,
      order.utm.utm_source, order.utm.utm_medium, order.utm.utm_campaign, order.utm.utm_content, order.utm.utm_term,
      order.utm.fbclid, order.utm.gclid, order.utm.landing,
    ),
    ...order.items.map((i, n) =>
      env.DB.prepare(
        `INSERT INTO order_items (order_id, position, slug, frame, color, lens, extras_json, qty, frame_price)
         VALUES (${byRef}, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(order.ref, n, i.slug, i.frame, i.color, i.lens, JSON.stringify(i.extras), i.qty, i.frame_price),
    ),
    env.DB.prepare(
      `INSERT INTO order_events (order_id, at, kind, to_status, actor, detail) VALUES (${byRef}, ?, 'created', 'no_pagado', 'web', 'Pedido desde la web')`,
    ).bind(order.ref, now),
  ];
  try {
    await env.DB.batch(stmts);
  } catch (e) {
    if (String(e).includes("UNIQUE")) return json({ ok: true, ref: order.ref }); // lost a race with its own twin
    return fail(500, "save failed");
  }
  return json({ ok: true, ref: order.ref }, 201);
};
