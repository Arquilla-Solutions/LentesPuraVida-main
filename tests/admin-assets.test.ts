// The board files must not be public static files (a path trick could skip the login check),
// and the packed copy the /admin function serves must match admin/. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
// @ts-ignore plain .mjs build script
import { OUT, render } from "../scripts/admin-assets.mjs";

test("no board files under public/ (would be served without the login check)", () => {
  assert.equal(existsSync(new URL("../public/admin", import.meta.url)), false);
});
test("packed board files are up to date (run `node scripts/admin-assets.mjs`)", () => {
  assert.equal(readFileSync(OUT, "utf8"), render());
});
