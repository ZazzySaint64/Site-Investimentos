import assert from "node:assert/strict";
import { test } from "node:test";
import { GENERIC_SAVE_ERROR, toActionResult } from "./action-result.ts";

test("rule messages pass through and raw database errors do not", () => {
  assert.deepEqual(toActionResult(null), { ok: true });
  assert.deepEqual(toActionResult({ code: "P0001", message: "Lançamento não encontrado." }), { ok: false, message: "Lançamento não encontrado." });
  assert.deepEqual(toActionResult({ code: "22003", message: "numeric field overflow" }), { ok: false, message: GENERIC_SAVE_ERROR });
  assert.deepEqual(toActionResult({ message: "fetch failed" }), { ok: false, message: GENERIC_SAVE_ERROR });
});
