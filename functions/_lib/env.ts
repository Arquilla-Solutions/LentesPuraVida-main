import type { AccessEnv } from "./access.ts";

export interface Env extends AccessEnv {
  DB: D1Database;
  TURNSTILE_SECRET?: string;
  RATE_SALT?: string;
  RATE_LIMIT_ORDERS?: string; // per IP per 10 minutes, default 8
  META_CAPI_TOKEN?: string; // Conversions API token; empty = no server-side Lead
  META_TEST_EVENT_CODE?: string; // optional, shows events in Events Manager > Test events
}
