import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidTarget, riskProfileFromAnswers, TARGETS } from "./profile.ts";

test("answers become a profile at the chosen limits", () => {
  assert.equal(riskProfileFromAnswers([0, 0, 0, 0, 0]), "conservador");
  assert.equal(riskProfileFromAnswers([1, 1, 1, 0, 0]), "conservador");
  assert.equal(riskProfileFromAnswers([1, 1, 1, 1, 0]), "moderado");
  assert.equal(riskProfileFromAnswers([2, 1, 1, 1, 1]), "moderado");
  assert.equal(riskProfileFromAnswers([2, 2, 1, 1, 1]), "arrojado");
  assert.equal(riskProfileFromAnswers([2, 2, 2, 2, 2]), "arrojado");
});

test("wrong answers raise an error", () => {
  assert.throws(() => riskProfileFromAnswers([0, 0, 0, 0]));
  assert.throws(() => riskProfileFromAnswers([0, 0, 0, 0, 3]));
});

test("targets are the ones in the spec and add up to 100", () => {
  assert.deepEqual(TARGETS.conservador, { renda_fixa: 70, acao_br: 15, fii: 10, acao_eua: 5, cripto: 0 });
  assert.deepEqual(TARGETS.moderado, { renda_fixa: 40, acao_br: 30, fii: 15, acao_eua: 10, cripto: 5 });
  assert.deepEqual(TARGETS.arrojado, { renda_fixa: 15, acao_br: 40, fii: 15, acao_eua: 20, cripto: 10 });
  for (const target of Object.values(TARGETS)) assert.equal(isValidTarget(target), true);
});

test("invalid targets are refused", () => {
  const base = TARGETS.moderado;
  assert.equal(isValidTarget({ ...base, cripto: 6 }), false);
  assert.equal(isValidTarget({ ...base, cripto: 4.5, fii: 15.5 }), false);
  assert.equal(isValidTarget({ ...base, cripto: -5, fii: 25 }), false);
  assert.equal(isValidTarget({ renda_fixa: 100 }), false);
  assert.equal(isValidTarget(null), false);
});
