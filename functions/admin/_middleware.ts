// The board page (/admin and its files). Access guards it at the edge; this checks again.
import type { Env } from "../_lib/env.ts";
import { adminIdentity } from "../_lib/access.ts";
import { BOARD_CSP, harden } from "../_lib/http.ts";

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Método no permitido", { status: 405 });
  if (!(await adminIdentity(request, env))) {
    return harden(new Response("Acceso denegado.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } }));
  }
  return harden(await next(), { "Content-Security-Policy": BOARD_CSP });
};
