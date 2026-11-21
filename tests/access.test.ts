// Access JWT check: only a correctly signed, unexpired token for our team, our app and an
// allowed email gets in. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { adminIdentity, devBypass, resetKeyCache, verifyAccessJwt, type Jwk } from "../functions/_lib/access.ts";

const TEAM = "lentes-test.cloudflareaccess.com";
const AUD = "aud-1234567890";
const env = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD, ADMIN_EMAILS: "seb@example.com, papa@example.com" };

const b64url = (b: ArrayBuffer | Uint8Array | string) =>
  Buffer.from(typeof b === "string" ? b : b instanceof Uint8Array ? b : new Uint8Array(b)).toString("base64url");

const pair = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const other = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const pub = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" } as Jwk;
let fetched = 0;
const fetcher = async (url: string) => { fetched++; assert.equal(url, `https://${TEAM}/cdn-cgi/access/certs`); return [pub]; };

const now = Math.floor(Date.now() / 1000);
const good = { iss: `https://${TEAM}`, aud: [AUD], email: "Seb@Example.com", exp: now + 3600, iat: now, nbf: now, type: "app" };

async function sign(claims: object, opts: { key?: CryptoKey; header?: object } = {}) {
  const h = b64url(JSON.stringify(opts.header ?? { alg: "RS256", kid: "k1", typ: "JWT" }));
  const p = b64url(JSON.stringify(claims));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", opts.key ?? pair.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(sig)}`;
}
const check = (t: string | null, e: object = env) => verifyAccessJwt(t, e, { fetcher });

test("valid token for an allowed email passes", async () => {
  resetKeyCache();
  assert.equal(await check(await sign(good)), "seb@example.com");
});
test("missing token -> denied", async () => assert.equal(await check(null), null));
test("garbage token -> denied", async () => assert.equal(await check("not.a.jwt"), null));
test("expired token -> denied", async () => assert.equal(await check(await sign({ ...good, exp: now - 5 })), null));
test("token not valid yet -> denied", async () => assert.equal(await check(await sign({ ...good, nbf: now + 600 })), null));
test("wrong audience -> denied", async () => assert.equal(await check(await sign({ ...good, aud: ["someone-else"] })), null));
test("wrong issuer -> denied", async () => assert.equal(await check(await sign({ ...good, iss: "https://evil.cloudflareaccess.com" })), null));
test("email not on the list -> denied", async () => assert.equal(await check(await sign({ ...good, email: "x@example.com" })), null));
test("no email (service token) -> denied", async () => { const { email, ...rest } = good; assert.equal(await check(await sign(rest)), null); });
test("signed by another key -> denied", async () => assert.equal(await check(await sign(good, { key: other.privateKey })), null));
test("tampered claims -> denied", async () => {
  const t = await sign(good);
  const [h, , s] = t.split(".");
  const forged = b64url(JSON.stringify({ ...good, email: "papa@example.com" }));
  assert.equal(await check(`${h}.${forged}.${s}`), null);
});
test("alg none / HS256 -> denied", async () => {
  const p = b64url(JSON.stringify(good));
  assert.equal(await check(`${b64url(JSON.stringify({ alg: "none", kid: "k1" }))}.${p}.`), null);
  assert.equal(await check(await sign(good, { header: { alg: "HS256", kid: "k1" } })), null);
});
test("unknown key id -> denied", async () => assert.equal(await check(await sign(good, { header: { alg: "RS256", kid: "nope" } })), null));
test("settings missing -> denied even with a valid token", async () => {
  const t = await sign(good);
  assert.equal(await check(t, { ...env, ACCESS_AUD: "" }), null);
  assert.equal(await check(t, { ...env, ACCESS_TEAM_DOMAIN: "" }), null);
  assert.equal(await check(t, { ...env, ADMIN_EMAILS: "" }), null);
});
test("certs endpoint down -> denied", async () => {
  resetKeyCache();
  const t = await sign(good);
  assert.equal(await verifyAccessJwt(t, env, { fetcher: async () => { throw new Error("down"); } }), null);
});

test("dev bypass only on localhost, only with the exact value, only without Access settings", () => {
  const dev = { DEV_BYPASS: "local-only-never-in-production" };
  assert.equal(devBypass(new Request("http://localhost:8788/admin/"), dev), true);
  assert.equal(devBypass(new Request("http://127.0.0.1:8788/admin/"), dev), true);
  assert.equal(devBypass(new Request("https://lentespuravida.com/admin/"), dev), false);
  assert.equal(devBypass(new Request("https://x.lentespuravida.pages.dev/admin/"), dev), false);
  assert.equal(devBypass(new Request("http://localhost/admin/"), { DEV_BYPASS: "true" }), false);
  assert.equal(devBypass(new Request("http://localhost/admin/"), { ...dev, ACCESS_AUD: AUD }), false);
  assert.equal(devBypass(new Request("http://localhost/admin/"), { ...dev, ACCESS_TEAM_DOMAIN: TEAM }), false);
});

test("adminIdentity on a production host with no token -> denied", async () => {
  assert.equal(await adminIdentity(new Request("https://lentespuravida.com/api/admin/orders"), { ...env, DEV_BYPASS: "local-only-never-in-production" }), null);
});

test("forged tokens with made-up key ids cannot make us refetch the certs on every request", async () => {
  resetKeyCache();
  assert.equal(await check(await sign(good)), "seb@example.com");
  const before = fetched;
  for (let i = 0; i < 20; i++) assert.equal(await check(await sign(good, { header: { alg: "RS256", kid: `junk-${i}` } })), null);
  assert.ok(fetched - before <= 1, `refetched ${fetched - before} times`);
  assert.equal(await check(await sign(good)), "seb@example.com"); // the real key still works from cache
});
