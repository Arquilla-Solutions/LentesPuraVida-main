// Checkout payload and board edit validation. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { Invalid, normalizePhone, validateOrder, validatePatch } from "../functions/_lib/validate.ts";

const base = () => ({
  type: "order", ref: "LPV-AB2CD", ts: new Date().toISOString(), name: "María José Pérez", whatsapp: "+506 8888 7777",
  province: "San José", canton: "Escazú", prescription: "typed",
  rx: { od: { sph: -1.25, cyl: -0.5, axis: 90, add: null }, oi: { sph: -1, cyl: 0, axis: null, add: null }, pd: { single: 63 } },
  payment: "SINPE Móvil", frame_subtotal: 1,
  items: [{ frame: "x", slug: "november", color: "Negro", lens: "sencilla", extras: ["azul"], qty: 2, frame_price: 1 }],
  page: "/checkout", turnstile: "tok", utm_source: "facebook",
});
const rejects = (o: unknown, why?: RegExp) => assert.throws(() => validateOrder(o), (e: any) => e instanceof Invalid && (!why || why.test(e.message)));

test("a good order passes and prices come from the catalog", () => {
  const o = validateOrder(base());
  assert.equal(o.whatsapp, "+50688887777");
  assert.equal(o.items[0].frame, "November");
  assert.notEqual(o.items[0].frame_price, 1);
  assert.equal(o.frame_subtotal, o.items[0].frame_price * 2);
});
test("whatsapp and no-receta modes pass without rx", () => {
  validateOrder({ ...base(), prescription: "whatsapp", rx: null });
  validateOrder({ ...base(), prescription: "none", rx: null });
});
test("unknown fields are refused at every level", () => {
  rejects({ ...base(), admin: true }, /unknown/);
  const b = base(); (b.items[0] as any).price_override = 0; rejects(b, /unknown/);
  const c = base(); (c.rx.od as any).prism = 1; rejects(c, /unknown/);
});
test("bad values are refused", () => {
  rejects({ ...base(), ref: "LPV-0000" }, /ref/);
  rejects({ ...base(), ref: "x'; DROP TABLE orders;--" }, /ref/);
  rejects({ ...base(), whatsapp: "12345" }, /whatsapp/);
  rejects({ ...base(), whatsapp: "+1 305 555 1234" }, /whatsapp/);
  rejects({ ...base(), province: "Florida" }, /province/);
  rejects({ ...base(), canton: "Liberia" }, /canton/); // Liberia is in Guanacaste, not San José
  rejects({ ...base(), payment: "Tarjeta" }, /payment/);
  rejects({ ...base(), name: "<script>alert(1)</script>" }, /name/);
  rejects({ ...base(), name: "A".repeat(81) }, /name/);
  rejects({ ...base(), type: "quote" }, /type/);
  rejects({ ...base(), items: [] }, /items/);
  rejects({ ...base(), items: Array(11).fill(base().items[0]) }, /items/);
  rejects({ ...base(), items: [{ ...base().items[0], slug: "no-such-frame" }] }, /slug/);
  rejects({ ...base(), items: [{ ...base().items[0], qty: 6 }] }, /qty/);
  rejects({ ...base(), items: [{ ...base().items[0], lens: "laser" }] }, /lens/);
  rejects({ ...base(), items: [{ ...base().items[0], extras: ["azul", "azul"] }] }, /extras/);
  rejects({ ...base(), prescription: "whatsapp" }, /rx only/);
  rejects([], /object/);
  rejects("hola", /object/);
});
test("prescription values must be real form values", () => {
  const b = base();
  b.rx.od.sph = -1.3; rejects(b, /sph/);
  const c = base(); c.rx.od.axis = null as any; rejects(c, /axis/);   // cyl without axis
  const d = base(); d.rx.oi.axis = 90 as any; rejects(d, /axis without cyl/); // eje with no cilindro
  const e = base(); e.rx.pd = { single: 99 } as any; rejects(e, /pd/);
  const f = base(); f.rx.od.add = 1.75 as any; f.rx.oi.add = 1.75 as any; validateOrder(f); // progresivos ADD ok
  const g = base(); g.rx.pd = { right: 31.5, left: 32 } as any; validateOrder(g);
});
test("phone normalizer", () => {
  assert.equal(normalizePhone("88887777"), "+50688887777");
  assert.equal(normalizePhone("506-2222-3333"), "+50622223333");
  assert.throws(() => normalizePhone("0888 7777"));
});
test("board edits: only listed fields, checked", () => {
  assert.deepEqual(validatePatch({ status: "pagado" }), { status: "pagado" });
  assert.deepEqual(validatePatch({ quoted_total: 104.999 }), { quoted_total: 105 });
  assert.deepEqual(validatePatch({ quoted_total: null }), { quoted_total: null });
  assert.throws(() => validatePatch({ status: "robado" }), Invalid);
  assert.throws(() => validatePatch({ id: 5 }), Invalid);
  assert.throws(() => validatePatch({ ref: "LPV-XXXX" }), Invalid);
  assert.throws(() => validatePatch({ quoted_total: -1 }), Invalid);
  assert.throws(() => validatePatch({ province: "Limón" }), Invalid); // canton must come with it
  assert.throws(() => validatePatch({ province: "Limón", canton: "Escazú" }), Invalid);
  assert.throws(() => validatePatch({}), Invalid);
  assert.throws(() => validatePatch({ notes: "x".repeat(4001) }), Invalid);
});

// ---------- Receta per pair (items[n].rx_override) ----------
const reading = { od: { sph: 1.5, cyl: 0, axis: null, add: 2 }, oi: { sph: 1.75, cyl: 0, axis: null, add: 2 }, pd: { single: 62 } };
const withPairs = (...overrides: unknown[]) => {
  const b = base();
  const first = b.items[0];
  return { ...b, items: [first, ...overrides.map((rx_override) => ({ ...first, slug: "apollo", qty: 1, rx_override }))] };
};

test("receta per pair: good overrides pass, missing means the order's receta", () => {
  const o = validateOrder(withPairs(
    { prescription: "typed", rx: reading, for: "  Mamá  " },
    { prescription: "whatsapp", rx: null },
    { prescription: "none" },
  ));
  assert.equal(o.items[0].rx_override, null);
  assert.deepEqual(o.items[1].rx_override, { prescription: "typed", rx: reading, for: "Mamá" });
  assert.deepEqual(o.items[2].rx_override, { prescription: "whatsapp", rx: null, for: "" });
  assert.deepEqual(o.items[3].rx_override, { prescription: "none", rx: null, for: "" });
  assert.equal(validateOrder(withPairs(null)).items[1].rx_override, null);
});
test("receta per pair: unknown keys refused", () => {
  rejects(withPairs({ prescription: "typed", rx: reading, admin: true }), /unknown field items\[1\]\.rx_override\.admin/);
  rejects(withPairs({ prescription: "typed", rx: { ...reading, prism: 1 } }), /unknown/);
  rejects(withPairs({ prescription: "typed", rx: { ...reading, od: { ...reading.od, base: 2 } } }), /unknown/);
  rejects(withPairs({ prescription: "typed", rx: reading, __proto__: { x: 1 }, constructor: 1 }), /unknown/);
});
test("receta per pair: bad values refused", () => {
  rejects(withPairs("typed"), /rx_override/);
  rejects(withPairs([]), /rx_override/);
  rejects(withPairs({ prescription: "laser" }), /rx_override\.prescription/);
  rejects(withPairs({ prescription: "typed" }), /rx_override\.rx missing/);
  rejects(withPairs({ prescription: "typed", rx: { ...reading, od: { ...reading.od, sph: -1.3 } } }), /rx_override\.rx\.od\.sph/);
  rejects(withPairs({ prescription: "typed", rx: { ...reading, oi: { ...reading.oi, axis: 90 } } }), /axis without cyl/);
  rejects(withPairs({ prescription: "typed", rx: { ...reading, pd: { single: 99 } } }), /pd/);
  rejects(withPairs({ prescription: "typed", rx: reading, for: "<b>Mamá</b>" }), /for characters/);
  rejects(withPairs({ prescription: "typed", rx: reading, for: "Mamá\u0000" }), /for characters/);
  rejects(withPairs({ prescription: "typed", rx: reading, for: 5 }), /for must be text/);
});
test("receta per pair: rx only with typed (whatsapp / none carry no numbers)", () => {
  rejects(withPairs({ prescription: "none", rx: reading }), /rx only with typed/);
  rejects(withPairs({ prescription: "whatsapp", rx: reading }), /rx only with typed/);
});
test("receta per pair: 'para quién' max 40 characters", () => {
  validateOrder(withPairs({ prescription: "none", for: "A".repeat(40) }));
  rejects(withPairs({ prescription: "none", for: "A".repeat(41) }), /for length/);
});
test("receta per pair: the biggest real order still fits in 16 KB", () => {
  const full = { prescription: "typed", rx: { ...reading, od: { sph: -12, cyl: -6, axis: 180, add: 3.5 }, pd: { right: 35.5, left: 35.5 } }, for: "Á".repeat(40) };
  const b = withPairs(...Array(9).fill(full));
  b.items.forEach((i: any) => { i.frame = "x".repeat(60); i.color = "Carey (Tortoise)/Dorado mate xx".slice(0, 40); i.extras = ["azul"]; });
  const big = { ...b, name: "María José Pérez Rodríguez de la Cruz", turnstile: "t".repeat(2048), utm_source: "s".repeat(120), utm_medium: "m".repeat(120), utm_campaign: "c".repeat(120), utm_content: "x".repeat(120), utm_term: "t".repeat(120), fbclid: "f".repeat(120), gclid: "g".repeat(120), landing: "/" + "l".repeat(119), page: "/checkout" };
  assert.equal(validateOrder(big).items.length, 10);
  const size = new TextEncoder().encode(JSON.stringify(big)).length;
  assert.ok(size < 16 * 1024, `payload ${size} bytes`);
});
