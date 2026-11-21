// GET /api/admin/meta: the lists the board needs (provinces, lens types, extras), from the
// same source files as the checkout, so the two never drift apart.
import type { Env } from "../../_lib/env.ts";
import { json } from "../../_lib/http.ts";
import { EXTRAS, LENSES, PROVINCES } from "../../../src/lib/store.ts";
import { STATUSES } from "../../_lib/validate.ts";

export const onRequestGet: PagesFunction<Env> = async () =>
  json({
    ok: true,
    statuses: STATUSES,
    provinces: PROVINCES,
    lenses: Object.fromEntries(LENSES.map((l) => [l.id, l.label])),
    extras: Object.fromEntries(EXTRAS.map((e) => [e.id, e.label])),
  });
