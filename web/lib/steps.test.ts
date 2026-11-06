import assert from "node:assert/strict";
import { test } from "node:test";
import { doneSteps, STEPS } from "./steps.ts";

test("the path follows the six stages of the plant", () => {
  assert.deepEqual(
    STEPS.map((step) => step.stage),
    ["Semente", "Raízes", "Broto", "Galhos", "Seca", "Árvore"],
  );
});

test("steps are marked only from the records", () => {
  assert.deepEqual([...doneSteps({ hasProfile: false, dailyLiquidity: false, purchaseDates: [] })], []);
  const some = doneSteps({
    hasProfile: true,
    dailyLiquidity: true,
    purchaseDates: ["2024-01-05", "2024-01-20", "2024-02-03"],
  });
  assert.deepEqual([...some].sort(), ["arvore", "raizes", "semente"]);
  const three = doneSteps({
    hasProfile: false,
    dailyLiquidity: false,
    purchaseDates: ["2024-01-05", "2024-02-03", "2024-03-01"],
  });
  assert.ok(three.has("broto"));
});
