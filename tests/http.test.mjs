// Over-the-wire tests against two local `wrangler pages dev` servers (see tests/README in CHANGES):
//   DEV    = http://localhost:8788  (.dev.vars: DEV_BYPASS on, Turnstile test secret)
//   LOCKED = http://localhost:8789  (Access settings set, no bypass, RATE_LIMIT_ORDERS=3, own database)
// Run: npm run test:http
import { test } from "node:test";
import assert from "node:assert/strict";

const DEV = process.env.DEV_URL ?? "http://localhost:8788";
const LOCKED = process.env.LOCKED_URL ?? "http://localhost:8789";
const ABC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const ref = () => "LPV-" + Array.from({ length: 5 }, () => ABC[Math.floor(Math.random() * ABC.length)]).join("");
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

const order = (over = {}) => ({
  type: "order", ref: ref(), name: "Prueba Uno", whatsapp: "+506 8888 7777", province: "Heredia", canton: "Belén",
  prescription: "whatsapp", rx: null, payment: "SINPE Móvil", frame_subtotal: 30,
  items: [{ frame: "November", slug: "november", color: "Negro", lens: "sencilla", extras: [], qty: 1, frame_price: 30 }],
  page: "/checkout", turnstile: "XXXX.DUMMY.TOKEN.XXXX", ...over,
});
// Each run looks like a fresh visitor so earlier runs do not count against the rate limit.
const RUN_IP = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
const post = (base, body, headers = {}) =>
  fetch(`${base}/api/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base, "CF-Connecting-IP": RUN_IP, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

// ---------- admin auth (LOCKED server: real Access check, no bypass) ----------
const now = Math.floor(Date.now() / 1000);
const fakeJwt = (claims) => `${b64({ alg: "RS256", kid: "k1" })}.${b64(claims)}.${Buffer.from("sig").toString("base64url")}`;
const claims = { iss: "https://lentes-test.cloudflareaccess.com", aud: ["aud-1234567890"], email: "seb@example.com", exp: now + 3600 };

for (const [what, headers] of [
  ["missing JWT", {}],
  ["garbage JWT", { "Cf-Access-Jwt-Assertion": "garbage" }],
  ["expired JWT", { "Cf-Access-Jwt-Assertion": fakeJwt({ ...claims, exp: now - 60 }) }],
  ["forged JWT (bad signature)", { "Cf-Access-Jwt-Assertion": fakeJwt(claims) }],
  ["wrong-audience JWT", { "Cf-Access-Jwt-Assertion": fakeJwt({ ...claims, aud: ["other"] }) }],
]) {
  test(`admin: ${what} -> 403 on API, page and files`, async () => {
    for (const path of ["/api/admin/orders", "/api/admin/orders/1", "/api/admin/meta", "/admin/", "/admin", "/admin/board.js"]) {
      const r = await fetch(`${LOCKED}${path}`, { headers, redirect: "manual" });
      assert.equal(r.status, 403, `${path} gave ${r.status}`);
      assert.equal(r.headers.get("cache-control"), "no-store");
    }
    const w = await fetch(`${LOCKED}/api/admin/orders/1`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json", Origin: LOCKED }, body: '{"status":"pagado"}' });
    assert.equal(w.status, 403);
  });
}
test("admin: path tricks cannot reach the board files around the login check", async () => {
  for (const path of ["/admin%2fboard.js", "/admin%2Fboard.js", "//admin/board.js", "/%61dmin/board.js", "/admin%2findex.html",
    "/%61dmin/", "/admin/./board.js", "/api/admin/../admin/board.js", "/ADMIN/board.js", "/admin/board.js."]) {
    const r = await fetch(`${LOCKED}${path}`, { redirect: "manual" });
    const body = await r.text();
    assert.notEqual(r.status, 200, `${path} gave 200`);
    assert.ok(!body.includes("order board"), `${path} leaked the board script`);
  }
});
test("admin: dev bypass is impossible when Access is configured, even on localhost", async () => {
  assert.equal((await fetch(`${LOCKED}/api/admin/orders`)).status, 403);
});

// ---------- admin writes (DEV server) ----------
test("admin: cross-site or non-JSON writes are refused", async () => {
  const r1 = await fetch(`${DEV}/api/admin/orders/1`, { method: "PATCH", headers: { "Content-Type": "application/json", Origin: "https://evil.example" }, body: '{"status":"pagado"}' });
  assert.equal(r1.status, 403);
  const r2 = await fetch(`${DEV}/api/admin/orders/1`, { method: "PATCH", headers: { "Content-Type": "text/plain", Origin: DEV }, body: '{"status":"pagado"}' });
  assert.equal(r2.status, 403);
  const r3 = await fetch(`${DEV}/api/admin/orders/1`, { method: "DELETE", headers: { Origin: DEV } });
  assert.equal(r3.status, 405);
  const r4 = await fetch(`${DEV}/api/admin/orders`, { method: "OPTIONS", headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "PATCH" } });
  assert.notEqual(r4.status, 200);
  assert.equal(r4.headers.get("access-control-allow-origin"), null);
});

// ---------- public order endpoint ----------
test("order: oversized body -> 400", async () => {
  const r = await post(DEV, order({ name: "x" }).name.padEnd(20000, "x"));
  assert.equal(r.status, 400);
  const r2 = await post(DEV, { ...order(), notes: "x".repeat(17000) });
  assert.equal(r2.status, 400);
});
test("order: invalid payloads -> 400", async () => {
  for (const bad of ["{not json", "[]", JSON.stringify(order({ ref: "nope" })), JSON.stringify(order({ extra: 1 })),
    JSON.stringify(order({ whatsapp: "123" })), JSON.stringify(order({ items: [] })), JSON.stringify(order({ payment: "Tarjeta" }))]) {
    const r = await post(DEV, bad);
    assert.equal(r.status, 400, bad.slice(0, 60));
  }
});
test("order: cross-site, wrong method, non-JSON are refused", async () => {
  assert.equal((await post(DEV, order(), { Origin: "https://evil.example" })).status, 403);
  assert.equal((await fetch(`${DEV}/api/order`, { method: "POST", body: JSON.stringify(order()) })).status, 403); // no Origin
  assert.equal((await post(DEV, order(), { "Content-Type": "text/plain" })).status, 415);
  assert.equal((await fetch(`${DEV}/api/order`)).status, 405);
});
test("order: no Turnstile token -> 403, nothing saved", async () => {
  const o = order({ turnstile: "" });
  assert.equal((await post(DEV, o)).status, 403);
  const list = await (await fetch(`${DEV}/api/admin/orders`)).json();
  assert.equal(list.orders.filter((x) => x.ref === o.ref).length, 0);
});
test("order: a saved code cannot be confirmed without the bot check (no guessing which codes exist)", async () => {
  const o = order();
  assert.equal((await post(DEV, o)).status, 201);
  const again = await post(DEV, { ...o, turnstile: "" });
  assert.equal(again.status, 403);
  assert.equal((await post(DEV, { ...order(), turnstile: "" })).status, 403);
});
test("order: the same ref twice -> one row", async () => {
  const o = order();
  const [a, b] = await Promise.all([post(DEV, o), post(DEV, o)]);
  const c = await post(DEV, o);
  assert.ok([200, 201].includes(a.status) && [200, 201].includes(b.status) && c.status === 200);
  const list = await (await fetch(`${DEV}/api/admin/orders`)).json();
  assert.equal(list.orders.filter((x) => x.ref === o.ref).length, 1);
});
test("order: rate limit per IP triggers (LOCKED server, 3 per 10 min)", async () => {
  const codes = [];
  const ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
  for (let i = 0; i < 5; i++) codes.push((await post(LOCKED, order(), { "CF-Connecting-IP": ip })).status);
  assert.deepEqual(codes.slice(0, 3).every((c) => c === 201), true, codes.join());
  assert.deepEqual(codes.slice(3), [429, 429]);
});
test("order: a pair with its own receta is saved and read back by the board; a bad one -> 400", async () => {
  const ip = { "CF-Connecting-IP": `192.0.2.${Math.floor(Math.random() * 250) + 1}` };
  const pair = { frame: "Apollo", slug: "apollo", color: "Negro", lens: "lectura", extras: [], qty: 1, frame_price: 1 };
  const own = { prescription: "typed", for: "Mamá", rx: { od: { sph: 1.5, cyl: 0, axis: null, add: 2 }, oi: { sph: 1.75, cyl: 0, axis: null, add: 2 }, pd: { single: 62 } } };
  const o = order({ items: [order().items[0], { ...pair, rx_override: own }, { ...pair, rx_override: { prescription: "whatsapp", rx: null } }] });
  assert.equal((await post(DEV, o, ip)).status, 201);
  const list = await (await fetch(`${DEV}/api/admin/orders`)).json();
  const id = list.orders.find((x) => x.ref === o.ref).id;
  const { order: saved } = await (await fetch(`${DEV}/api/admin/orders/${id}`)).json();
  assert.equal(saved.items[0].rx_override, null);
  assert.deepEqual(saved.items[1].rx_override, own);
  assert.deepEqual(saved.items[2].rx_override, { prescription: "whatsapp", rx: null, for: "" });
  const bad = order({ items: [{ ...pair, rx_override: { prescription: "none", rx: own.rx } }] });
  assert.equal((await post(DEV, bad, ip)).status, 400);
  const bad2 = order({ items: [{ ...pair, rx_override: { ...own, sneaky: 1 } }] });
  assert.equal((await post(DEV, bad2, ip)).status, 400);
});
