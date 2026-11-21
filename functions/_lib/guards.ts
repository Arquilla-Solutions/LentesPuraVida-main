import { DEV_HOSTS } from "./access.ts";

// Rate limit (fixed window, counted in D1, IPs stored only as salted hashes) and Turnstile.

export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Adds one hit to `key` in the current window and returns true while still under `max`. */
export async function underLimit(db: D1Database, key: string, max: number, windowSec: number, now = Date.now()): Promise<boolean> {
  const win = Math.floor(now / 1000 / windowSec) * windowSec;
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN window_start = excluded.window_start THEN count + 1 ELSE 1 END,
         window_start = excluded.window_start
       RETURNING count`,
    )
    .bind(key, win)
    .first<{ count: number }>();
  return (row?.count ?? Infinity) <= max;
}

// Cloudflare's public Turnstile test secrets (always pass / always fail / already spent).
const TEST_SECRET = /^[123]x0+AA$/;

/**
 * Server-side Turnstile check. Missing secret or token = not human. On a real hostname the
 * answer must be for this site and the checkout action, and a test secret never passes, so a
 * copied .dev.vars value or a token solved on another site cannot open the door.
 */
export async function turnstileOk(
  secret: string | undefined, token: string, ip: string, host: string, fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!secret || !token) return false;
  const local = DEV_HOSTS.has(host);
  if (!local && TEST_SECRET.test(secret.trim())) return false;
  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);
    form.append("idempotency_key", crypto.randomUUID());
    const res = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    if (!res.ok) return false;
    const out = (await res.json()) as { success?: boolean; action?: string; hostname?: string };
    if (out.success !== true) return false;
    if (local) return !out.action || out.action === "checkout";
    return out.action === "checkout" && out.hostname === host;
  } catch {
    return false;
  }
}
