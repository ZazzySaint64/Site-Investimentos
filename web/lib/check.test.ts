import assert from "node:assert/strict";
import { test } from "node:test";
import { findAssets } from "./check.ts";

const assets = [
  { ticker: "PETR4", name: "Petrobras PN" },
  { ticker: "PETR3", name: "Petrobras ON" },
  { ticker: "HGLG11", name: "Pátria Log" },
  { ticker: "TD-IPCA-20350515", name: "Tesouro IPCA+ 2035" },
];

test("a code finds its investment whatever the case", () => {
  assert.equal(findAssets(assets, " hglg11 ").exact?.ticker, "HGLG11");
});

test("a name without accents finds the one investment that has it", () => {
  assert.equal(findAssets(assets, "patria").exact?.ticker, "HGLG11");
  assert.equal(findAssets(assets, "ipca 2035").exact?.ticker, "TD-IPCA-20350515");
});

test("a name shared by several investments lists them", () => {
  const found = findAssets(assets, "petrobras");
  assert.equal(found.exact, null);
  assert.deepEqual(
    found.matches.map((asset) => asset.ticker),
    ["PETR4", "PETR3"],
  );
});

test("nothing typed or nothing found gives an empty answer", () => {
  assert.deepEqual(findAssets(assets, "  "), { exact: null, matches: [] });
  assert.deepEqual(findAssets(assets, "bitcoin"), { exact: null, matches: [] });
});
