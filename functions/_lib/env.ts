import type { AccessEnv } from "./access.ts";

export interface Env extends AccessEnv {
  DB: D1Database;
  TURNSTILE_SECRET?: string;
  RATE_SALT?: string;
  RATE_LIMIT_ORDERS?: string; // per IP per 10 minutes, default 8
}
