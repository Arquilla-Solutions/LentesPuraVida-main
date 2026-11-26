// Pixel Lead should fire only after /api/order confirms the save. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { orderWasSaved } from "../src/lib/tracking.ts";

const res = (status: number, body?: unknown, raw?: string) =>
  new Response(raw ?? (body === undefined ? null : JSON.stringify(body)), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("orderWasSaved: 201 with ok:true counts as saved", async () => {
  assert.equal(await orderWasSaved(res(201, { ok: true, ref: "LPV-ABCDE" })), true);
});

test("orderWasSaved: idempotent already-saved 200 with ok:true counts as saved", async () => {
  assert.equal(await orderWasSaved(res(200, { ok: true, ref: "LPV-ABCDE" })), true);
});

test("orderWasSaved: Turnstile 403 is not a Lead", async () => {
  assert.equal(await orderWasSaved(res(403, { ok: false, error: "turnstile" })), false);
});

test("orderWasSaved: validation 400, rate limit 429 and save failed 500 are not a Lead", async () => {
  assert.equal(await orderWasSaved(res(400, { ok: false, error: "name characters" })), false);
  assert.equal(await orderWasSaved(res(429, { ok: false, error: "slow down" })), false);
  assert.equal(await orderWasSaved(res(500, { ok: false, error: "save failed" })), false);
});

test("orderWasSaved: ok is not true, or the body is not JSON, is not a Lead", async () => {
  assert.equal(await orderWasSaved(res(201, { ok: false })), false);
  assert.equal(await orderWasSaved(res(200, { ok: false })), false);
  assert.equal(await orderWasSaved(res(200, {})), false);
  assert.equal(await orderWasSaved(res(201, undefined, "not-json")), false);
  assert.equal(await orderWasSaved(new Response(null, { status: 201 })), false);
});
