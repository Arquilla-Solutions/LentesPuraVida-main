// The board files. Served only from here, after functions/admin/_middleware.ts has checked the
// login; they are not in public/, so the static file server has nothing to hand out.
import { ADMIN_ASSETS } from "../_lib/admin-assets.gen.ts";

export const onRequest: PagesFunction = async ({ params }) => {
  const parts = Array.isArray(params.path) ? params.path : params.path ? [params.path] : [];
  const name = parts.length === 0 ? "index.html" : parts.join("/");
  const file = Object.hasOwn(ADMIN_ASSETS, name) ? ADMIN_ASSETS[name] : null;
  if (!file) return new Response("No encontrado.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(file.body, { headers: { "Content-Type": file.type } });
};
