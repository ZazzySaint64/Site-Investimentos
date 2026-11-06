import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { alreadySaved, inSavingOrder, readExtract } from "./b3-extract.ts";
import { readFirstSheet } from "./xlsx.ts";

const fixture = new Uint8Array(readFileSync(new URL("../e2e/fixtures/negociacao.xlsx", import.meta.url)));

test("the sheet is read with text and number cells", async () => {
  const rows = await readFirstSheet(fixture);
  assert.equal(rows[0][0], "Data do Negócio");
  assert.equal(rows[1][6], 10);
  assert.equal(rows[2][7], "R$ 35,50");
});

test("the statement becomes purchases and sales, and the rest is said", async () => {
  const extract = readExtract(await readFirstSheet(fixture));
  assert.ok(extract.ok);
  assert.deepEqual(extract.operations.slice(0, 3), [
    { line: 2, ticker: "ITUB4", type: "buy", quantity: 10, price: 30, date: "2024-03-15" },
    { line: 3, ticker: "PETR4", type: "buy", quantity: 5, price: 35.5, date: "2024-03-15" },
    { line: 4, ticker: "ITUB4", type: "sell", quantity: 4, price: 32.1, date: "2024-04-10" },
  ]);
  assert.equal(extract.operations.length, 4); // ZZZZ3 is read; the page says it is not on the list
  assert.deepEqual(extract.skipped.map((item) => item.line), [5]);
  assert.match(extract.skipped[0].problem, /Opção de Compra/);
});

test("a file without the code column is refused with a reason", () => {
  const extract = readExtract([["Nome", "Valor"], ["x", 1]]);
  assert.equal(extract.ok, false);
});

test("missing columns are named with the ones found", () => {
  const extract = readExtract([["Código de Negociação", "Quantidade"], ["ITUB4", 1]]);
  assert.ok(!extract.ok && /Colunas encontradas: Código de Negociação, Quantidade/.test(extract.problem));
});

test("excel day numbers and accents in the header are accepted", () => {
  const extract = readExtract([
    ["DATA DO NEGOCIO", "TIPO DE MOVIMENTACAO", "CODIGO DE NEGOCIACAO", "QUANTIDADE", "PRECO"],
    [45366, "Compra", "BBAS3", 2, "1.234,5"],
  ]);
  assert.ok(extract.ok);
  assert.deepEqual(extract.operations[0], { line: 2, ticker: "BBAS3", type: "buy", quantity: 2, price: 1234.5, date: "2024-03-15" });
});

test("operations already in the wallet are matched one to one", () => {
  const operation = { ticker: "ITUB4", type: "buy" as const, quantity: 10, price: 30, date: "2024-03-15" };
  const saved = alreadySaved(
    [
      { ...operation, line: 2 },
      { ...operation, line: 3 },
    ],
    [operation],
  );
  assert.deepEqual([...saved], [2]);
});

test("purchases go before sales on the same day", () => {
  const order = inSavingOrder([
    { line: 2, type: "sell", date: "2024-01-02" },
    { line: 3, type: "buy", date: "2024-01-02" },
    { line: 4, type: "buy", date: "2024-01-01" },
  ]);
  assert.deepEqual(order.map((item) => item.line), [4, 3, 2]);
});
