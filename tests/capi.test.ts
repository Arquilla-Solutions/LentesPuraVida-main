// Meta Conversions API Lead: payload shape, privacy, and that nothing can break an order. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { META_PIXEL_ID, buildLeadEvent, sendLead } from "../functions/_lib/capi.ts";
import { META_PIXEL_ID as BROWSER_ID, cartParams } from "../src/lib/tracking.ts";
import type { CleanOrder } from "../functions/_lib/validate.ts";
import type { Env } from "../functions/_lib/env.ts";

const NOW = 1_764_000_000_123;
const TOKEN = "EAAsecret-token-value";
const order = (over: Partial<CleanOrder> = {}, utm: Partial<CleanOrder["utm"]> = {}): CleanOrder => ({
  ref: "LPV-ABCDE", name: "María Prueba", whatsapp: "+50688887777", province: "Heredia", canton: "Belén",
  prescription: "typed", rx: { od: { sph: -1.25, cyl: 0, axis: null, add: null }, oi: { sph: -1, cyl: 0, axis: null, add: null }, pd: null },
  payment: "SINPE Móvil",
  items: [
    { slug: "november", frame: "November", color: "Negro", lens: "sencilla", extras: [], qty: 2, frame_price: 30, rx_override: null },
    { slug: "aurora", frame: "Aurora", color: "Carey", lens: "sencilla", extras: [], qty: 1, frame_price: 45,
      rx_override: { prescription: "whatsapp", rx: null, for: "Abuela Rosa" } },
  ],
  frame_subtotal: 105, page: "/checkout", turnstile: "tok",
  utm: { utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "", utm_term: "", fbclid: "", gclid: "", landing: "", ...utm },
  ...over,
});
const req = (headers: Record<string, string> = {}) =>
  new Request("https://lentespuravida.com/api/order", {
    method: "POST",
    headers: { "CF-Connecting-IP": "203.0.113.9", "User-Agent": "Mozilla/5.0 Test", ...headers },
  });
const env = (over: Partial<Env> = {}) => ({ META_CAPI_TOKEN: TOKEN, ...over }) as Env;

function spyFetch(res: () => Response | Promise<Response>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => { calls.push({ url, init }); return res(); }) as unknown as typeof fetch;
  return { f, calls };
}
async function captureLogs(fn: () => Promise<void>) {
  const lines: string[] = [];
  const { log, warn, error } = console;
  console.log = console.warn = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(" ")); };
  try { await fn(); } finally { Object.assign(console, { log, warn, error }); }
  return lines;
}

test("pixel id matches the browser pixel", () => {
  assert.equal(META_PIXEL_ID, BROWSER_ID);
  assert.equal(META_PIXEL_ID, "3281712312220105");
});

test("payload shape, event_id = ref, custom_data mirrors cartParams()", () => {
  const e = buildLeadEvent(order(), req(), NOW);
  assert.equal(e.event_name, "Lead");
  assert.equal(e.event_id, "LPV-ABCDE");
  assert.equal(e.event_time, Math.floor(NOW / 1000));
  assert.equal(e.action_source, "website");
  assert.equal(e.event_source_url, "https://lentespuravida.com/checkout");
  const browser = cartParams([{ slug: "november", price: 30, qty: 2 }, { slug: "aurora", price: 45, qty: 1 }]);
  assert.deepEqual(e.custom_data, browser);
  assert.deepEqual(e.user_data, { client_ip_address: "203.0.113.9", client_user_agent: "Mozilla/5.0 Test" });
});

test("only allowed user_data keys, no personal data anywhere", () => {
  const e = buildLeadEvent(order({}, { fbclid: "abc123" }), req({ Cookie: "_fbp=fb.1.1.222; _fbc=fb.1.1.333; other=x" }), NOW);
  for (const k of Object.keys(e.user_data)) assert.ok(["client_ip_address", "client_user_agent", "fbp", "fbc"].includes(k), k);
  const s = JSON.stringify(e);
  for (const bad of ["María", "Prueba", "88887777", "Heredia", "Belén", "Rosa", "sph", "SINPE", "Negro", "Carey", "sencilla", '"rx', "whatsapp", '"name"', "province", "canton", "prescription"]) {
    assert.ok(!s.includes(bad), `leaked ${bad}`);
  }
  for (const k of ["em", "ph", "fn", "ln", "ct", "st", "zp", "country", "external_id"]) assert.ok(!s.includes(`"${k}"`), k);
});

test("fbc from cookie wins over fbclid", () => {
  const e = buildLeadEvent(order({}, { fbclid: "clickid" }), req({ Cookie: "_fbc=fb.1.111.cookieclick; _fbp=fb.1.2.3" }), NOW);
  assert.equal(e.user_data.fbc, "fb.1.111.cookieclick");
  assert.equal(e.user_data.fbp, "fb.1.2.3");
});
test("fbc built from fbclid when no cookie", () => {
  const e = buildLeadEvent(order({}, { fbclid: "IwAR_abc-123" }), req(), NOW);
  assert.equal(e.user_data.fbc, `fb.1.${NOW}.IwAR_abc-123`);
  assert.equal(e.user_data.fbp, undefined);
});
test("no fbc when neither cookie nor fbclid", () => {
  const e = buildLeadEvent(order(), req({ Cookie: "a=b" }), NOW);
  assert.ok(!("fbc" in e.user_data) && !("fbp" in e.user_data));
});
test("bad cookie values and bad fbclid are dropped", () => {
  const long = "fb.1.1." + "x".repeat(300);
  for (const c of [`_fbp=${long}; _fbc=${long}`, "_fbp=evil; _fbc=notfb.1.2", "_fbp=fb.1\u0001.2; _fbc=fb.\u007f"]) {
    const e = buildLeadEvent(order({}, { fbclid: "bad id<>" }), req({ Cookie: c }), NOW);
    assert.ok(!("fbp" in e.user_data) && !("fbc" in e.user_data), c);
  }
});
test("empty IP and user agent are omitted, user agent capped at 512", () => {
  const e = buildLeadEvent(order(), new Request("https://lentespuravida.com/api/order"), NOW);
  assert.deepEqual(e.user_data, {});
  const e2 = buildLeadEvent(order(), req({ "User-Agent": "U".repeat(2000) }), NOW);
  assert.equal(e2.user_data.client_user_agent!.length, 512);
});

test("event_source_url always on the request host", () => {
  const url = (landing: string, page = "") => buildLeadEvent(order({ page }, { landing }), req(), NOW).event_source_url;
  assert.equal(url("/lentes/november"), "https://lentespuravida.com/lentes/november");
  assert.equal(url("", "/carrito"), "https://lentespuravida.com/carrito");
  assert.equal(url("/lentes?x=1#y"), "https://lentespuravida.com/lentes");
  for (const weird of ["https://evil.example/x", "//evil.example/x", "/\\evil.example", "javascript:alert(1)", "/%2F%2Fevil", "lentes"]) {
    assert.ok(url(weird).startsWith("https://lentespuravida.com/"), weird);
  }
  assert.equal(url("https://evil.example/x"), "https://lentespuravida.com/checkout");
});

test("missing token: no fetch call, nothing logged", async () => {
  const { f, calls } = spyFetch(() => new Response("{}"));
  const lines = await captureLogs(() => sendLead(env({ META_CAPI_TOKEN: "" }), buildLeadEvent(order(), req(), NOW), f));
  await sendLead({} as Env, buildLeadEvent(order(), req(), NOW), f);
  assert.equal(calls.length, 0);
  assert.deepEqual(lines, []);
});

test("sends token in the body, not the URL; test_event_code only when set", async () => {
  const { f, calls } = spyFetch(() => new Response(JSON.stringify({ events_received: 1 })));
  const lines = await captureLogs(async () => {
    await sendLead(env(), buildLeadEvent(order(), req(), NOW), f);
    await sendLead(env({ META_TEST_EVENT_CODE: "TEST123" }), buildLeadEvent(order(), req(), NOW), f);
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://graph.facebook.com/v21.0/3281712312220105/events");
  assert.ok(!calls[0].url.includes(TOKEN));
  const b0 = JSON.parse(String(calls[0].init.body));
  const b1 = JSON.parse(String(calls[1].init.body));
  assert.equal(b0.access_token, TOKEN);
  assert.ok(!("test_event_code" in b0));
  assert.equal(b1.test_event_code, "TEST123");
  assert.equal(b0.data[0].event_id, "LPV-ABCDE");
  assert.deepEqual(lines, ["capi lead ok events_received=1 ref=LPV-ABCDE", "capi lead ok events_received=1 ref=LPV-ABCDE"]);
});

test("Meta 400, fetch throwing, and timeout all resolve quietly without the token", async () => {
  const e = buildLeadEvent(order(), req(), NOW);
  const r400 = spyFetch(() => new Response(JSON.stringify({ error: { message: `bad token ${TOKEN}` } }), { status: 400 }));
  const throws = (async () => { throw new Error(`boom ${TOKEN}`); }) as unknown as typeof fetch;
  const hangs = ((_u: string, init: RequestInit) => new Promise((_, reject) => {
    init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
  })) as unknown as typeof fetch;
  const lines = await captureLogs(async () => {
    await sendLead(env(), e, r400.f);
    await sendLead(env(), e, throws);
    await sendLead(env(), e, hangs, 20);
  });
  assert.deepEqual(lines, ["capi lead failed status=400", "capi lead failed status=error", "capi lead failed status=timeout"]);
  for (const l of lines) {
    assert.ok(!l.includes(TOKEN));
    assert.ok(!l.includes("203.0.113.9") && !l.includes("Mozilla"));
  }
});
