// GET /api/admin/orders: every order as a card (newest first, up to 1000).
import type { Env } from "../../../_lib/env.ts";
import { json } from "../../../_lib/http.ts";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT o.id, o.ref, o.created_at, o.status, o.status_at, o.name, o.whatsapp, o.province, o.canton,
            o.prescription, o.quoted_total, o.ebd_order_number,
            COALESCE((SELECT SUM(qty) FROM order_items i WHERE i.order_id = o.id), 0) AS pairs
       FROM orders o ORDER BY o.created_at DESC LIMIT 1000`,
  ).all();
  return json({ ok: true, orders: results });
};
