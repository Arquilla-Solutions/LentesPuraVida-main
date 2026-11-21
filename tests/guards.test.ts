// Turnstile answer checks. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { turnstileOk } from "../functions/_lib/guards.ts";

const REAL = "0x4AAAAAAAexample-real-secret";
const TEST = "1x0000000000000000000000000000000AA";
const answer = (body: object) => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;
const good = { success: true, action: "checkout", hostname: "lentespuravida.com" };

test("real answer for this site and action passes", async () => {
  assert.equal(await turnstileOk(REAL, "tok", "1.2.3.4", "lentespuravida.com", answer(good)), true);
});
test("missing secret or token fails", async () => {
  assert.equal(await turnstileOk("", "tok", "", "lentespuravida.com", answer(good)), false);
  assert.equal(await turnstileOk(REAL, "", "", "lentespuravida.com", answer(good)), false);
});
test("token solved on another site fails", async () => {
  assert.equal(await turnstileOk(REAL, "tok", "", "lentespuravida.com", answer({ ...good, hostname: "evil.example" })), false);
});
test("wrong or missing action fails on the real site", async () => {
  assert.equal(await turnstileOk(REAL, "tok", "", "lentespuravida.com", answer({ ...good, action: "login" })), false);
  assert.equal(await turnstileOk(REAL, "tok", "", "lentespuravida.com", answer({ success: true, hostname: "lentespuravida.com" })), false);
});
test("Cloudflare's test secret never passes on a real hostname", async () => {
  let called = false;
  const spy = (async () => { called = true; return new Response(JSON.stringify(good)); }) as unknown as typeof fetch;
  assert.equal(await turnstileOk(TEST, "tok", "", "lentespuravida.com", spy), false);
  assert.equal(called, false);
});
test("test secret still works on localhost (dev)", async () => {
  assert.equal(await turnstileOk(TEST, "tok", "", "localhost", answer({ success: true, hostname: "example.com" })), true);
});
test("siteverify down or saying no fails", async () => {
  assert.equal(await turnstileOk(REAL, "tok", "", "lentespuravida.com", answer({ success: false })), false);
  const down = (async () => { throw new Error("down"); }) as unknown as typeof fetch;
  assert.equal(await turnstileOk(REAL, "tok", "", "lentespuravida.com", down), false);
});
