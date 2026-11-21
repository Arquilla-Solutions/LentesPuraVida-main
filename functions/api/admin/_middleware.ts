// Every /api/admin/* request passes here first: Access token checked again in code,
// writes must be same-origin JSON, nothing is cached, no CORS.
import type { Env } from "../../_lib/env.ts";
import { adminIdentity } from "../../_lib/access.ts";
import { fail, harden, isJson, sameOrigin } from "../../_lib/http.ts";

export const onRequest: PagesFunction<Env, string, { email: string }> = async ({ request, env, next, data }) => {
  const email = await adminIdentity(request, env);
  if (!email) return fail(403, "forbidden");
  if (!["GET", "PATCH"].includes(request.method)) return fail(405, "method");
  if (request.method !== "GET" && (!sameOrigin(request) || !isJson(request))) return fail(403, "same-origin json only");
  data.email = email;
  return harden(await next());
};
