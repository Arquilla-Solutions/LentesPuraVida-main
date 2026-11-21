// Cloudflare Access check, done again inside the code even though Access already guards the
// door. Deny by default: missing settings, a missing or bad token, or an email that is not on
// the list all mean 403. No passwords are stored anywhere.

export interface AccessEnv {
  ACCESS_TEAM_DOMAIN?: string; // e.g. lentespuravida.cloudflareaccess.com
  ACCESS_AUD?: string;         // the Access application's Audience (AUD) tag
  ADMIN_EMAILS?: string;       // comma-separated allowlist
  DEV_BYPASS?: string;         // local dev only, see devBypass()
}

export type Jwk = JsonWebKey & { kid?: string };
export type KeyFetcher = (certsUrl: string) => Promise<Jwk[]>;

const DEV_BYPASS_VALUE = "local-only-never-in-production";
const DEV_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const LEEWAY = 30; // seconds of clock skew allowed on nbf/iat

const b64urlBytes = (s: string): Uint8Array => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const b64urlJson = (s: string): any => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));

export const teamHost = (raw: string) => raw.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
export const allowlist = (raw = "") =>
  raw.split(",").map((e) => e.trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));

/**
 * Local dev only. All three must hold: the exact DEV_BYPASS value (only ever in .dev.vars),
 * the request is for localhost, and Access is NOT configured. A production deploy has Access
 * configured and a real hostname, so this can never switch on there.
 */
export function devBypass(request: Request, env: AccessEnv): boolean {
  if (env.DEV_BYPASS !== DEV_BYPASS_VALUE) return false;
  if (env.ACCESS_AUD || env.ACCESS_TEAM_DOMAIN) return false;
  return DEV_HOSTS.has(new URL(request.url).hostname);
}

let cache: { url: string; keys: Jwk[]; at: number } | null = null;
const defaultFetcher: KeyFetcher = async (url) => {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`certs ${res.status}`);
  const body = (await res.json()) as { keys?: Jwk[] };
  return Array.isArray(body.keys) ? body.keys : [];
};

async function keyFor(kid: string, certsUrl: string, fetcher: KeyFetcher): Promise<Jwk | undefined> {
  const fresh = cache && cache.url === certsUrl && Date.now() - cache.at < 10 * 60_000;
  let hit = fresh ? cache!.keys.find((k) => k.kid === kid) : undefined;
  if (!hit) { // unknown kid: refetch once (Access rotates keys)
    const keys = await fetcher(certsUrl);
    cache = { url: certsUrl, keys, at: Date.now() };
    hit = keys.find((k) => k.kid === kid);
  }
  return hit;
}

export function resetKeyCache() { cache = null; }

/** Returns the verified email, or null. Never throws. */
export async function verifyAccessJwt(
  token: string | null,
  env: AccessEnv,
  opts: { fetcher?: KeyFetcher; now?: number } = {},
): Promise<string | null> {
  try {
    const team = teamHost(env.ACCESS_TEAM_DOMAIN ?? "");
    const aud = (env.ACCESS_AUD ?? "").trim();
    const allowed = allowlist(env.ADMIN_EMAILS);
    if (!team || !aud || !allowed.length || !token) return null;
    if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token) || token.length > 8192) return null;
    const [h, p, s] = token.split(".");
    const header = b64urlJson(h);
    const claims = b64urlJson(p);
    if (header?.alg !== "RS256" || typeof header.kid !== "string") return null;

    const now = Math.floor((opts.now ?? Date.now()) / 1000);
    if (claims?.iss !== `https://${team}`) return null;
    const auds: unknown[] = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!auds.includes(aud)) return null;
    if (typeof claims.exp !== "number" || claims.exp <= now) return null;
    if (typeof claims.nbf === "number" && claims.nbf > now + LEEWAY) return null;
    if (typeof claims.iat === "number" && claims.iat > now + LEEWAY) return null;
    const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
    if (!email || !allowed.includes(email)) return null;

    const jwk = await keyFor(header.kid, `https://${team}/cdn-cgi/access/certs`, opts.fetcher ?? defaultFetcher);
    if (!jwk || jwk.kty !== "RSA") return null;
    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5", key, b64urlBytes(s), new TextEncoder().encode(`${h}.${p}`),
    );
    return ok ? email : null;
  } catch {
    return null;
  }
}

/** The one gate every admin function calls. Returns the email (or "dev@localhost") or null. */
export async function adminIdentity(request: Request, env: AccessEnv): Promise<string | null> {
  if (devBypass(request, env)) return "dev@localhost";
  return verifyAccessJwt(request.headers.get("Cf-Access-Jwt-Assertion"), env);
}
