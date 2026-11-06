"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { alreadySaved, readExtract, type Operation, type Skipped } from "@/lib/b3-extract";
import { formatDate, formatMoney, formatQuantity } from "@/lib/phrases";
import { readFirstSheet } from "@/lib/xlsx";
import { importTransactionsAction, type ImportResult } from "../lancar/actions";

type Existing = { ticker: string; type: string; quantity: number; price: number; date: string };
type Row = Operation & { status: "new" | "saved" | "unknown"; name: string | null };

const BUTTON = "rounded-full bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-60";
const HEAD = "px-3 py-2 font-medium";
const CELL = "px-3 py-2";
// On a phone the line, quantity, price and status go under the operation.
const WIDE = "hidden sm:table-cell";

const STATUS = {
  new: "Vai entrar",
  saved: "Já está na carteira",
  unknown: "Fora da lista do site",
} as const;

export function ImportForm({
  holdable,
  existing,
}: {
  holdable: [string, string][];
  existing: Existing[];
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [skipped, setSkipped] = useState<Skipped[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  async function read(file: File | undefined) {
    setRows(null);
    setSkipped([]);
    setProblem(null);
    setResult(null);
    if (!file) return;
    let extract;
    try {
      extract = readExtract(await readFirstSheet(new Uint8Array(await file.arrayBuffer())));
    } catch {
      setProblem("Não consegui ler o arquivo. Ele precisa ser uma planilha .xlsx.");
      return;
    }
    if (!extract.ok) {
      setProblem(extract.problem);
      return;
    }
    const names = new Map(holdable);
    const saved = alreadySaved(extract.operations, existing);
    setRows(
      extract.operations.map((operation) => ({
        ...operation,
        name: names.get(operation.ticker) ?? null,
        status: !names.has(operation.ticker)
          ? "unknown"
          : saved.has(operation.line)
            ? "saved"
            : "new",
      })),
    );
    setSkipped(extract.skipped);
  }

  const toSave = rows?.filter((row) => row.status === "new") ?? [];

  function save() {
    startTransition(async () => {
      const outcome = await importTransactionsAction(
        toSave.map(({ line, ticker, type, quantity, price, date }) => ({
          line,
          ticker,
          type,
          quantity,
          price,
          date,
        })),
      );
      setResult(outcome);
      const failed = new Set(outcome.failed.map((item) => item.line));
      setRows(
        (current) =>
          current?.map((row) =>
            row.status === "new" && !failed.has(row.line) ? { ...row, status: "saved" } : row,
          ) ?? null,
      );
    });
  }

  return (
    <section aria-label="Importar extrato" className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Extrato de negociação (.xlsx)</span>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => read(event.target.files?.[0])}
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-mist file:px-3 file:py-2"
        />
      </label>

      {problem && (
        <p role="alert" className="text-sm">
          {problem}
        </p>
      )}

      {rows && (
        <>
          <p className="text-sm">
            {rows.length} operações lidas, {toSave.length} para lançar.
            {rows.length > toSave.length &&
              " As que já estão na carteira ou estão fora da lista do site ficam de fora."}
          </p>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border">
                  <th scope="col" className={`${HEAD} ${WIDE}`}>
                    Linha
                  </th>
                  <th scope="col" className={HEAD}>
                    Data
                  </th>
                  <th scope="col" className={HEAD}>
                    Operação
                  </th>
                  <th scope="col" className={`${HEAD} ${WIDE} text-right`}>
                    Quantidade
                  </th>
                  <th scope="col" className={`${HEAD} ${WIDE} text-right`}>
                    Preço
                  </th>
                  <th scope="col" className={`${HEAD} ${WIDE}`}>
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const error = result?.failed.find((item) => item.line === row.line);
                  const status = error ? error.message : STATUS[row.status];
                  return (
                    <tr key={row.line}>
                      <td className={`${CELL} ${WIDE} tabular-nums text-muted`}>{row.line}</td>
                      <td className={`${CELL} tabular-nums`}>{formatDate(row.date)}</td>
                      <td className={CELL}>
                        {row.type === "buy" ? "Compra" : "Venda"} de {row.ticker}
                        {row.name && <span className="block text-xs text-muted">{row.name}</span>}
                        <span className="block text-xs tabular-nums text-text-soft sm:hidden">
                          {formatQuantity(row.quantity)} × {formatMoney(row.price)} · {status}
                        </span>
                      </td>
                      <td className={`${CELL} ${WIDE} text-right tabular-nums`}>
                        {formatQuantity(row.quantity)}
                      </td>
                      <td className={`${CELL} ${WIDE} text-right tabular-nums`}>
                        {formatMoney(row.price)}
                      </td>
                      <td className={`${CELL} ${WIDE}`}>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {skipped.length > 0 && (
            <div className="space-y-1 text-sm text-text-soft">
              <p>Linhas deixadas de fora, porque não são compra ou venda à vista:</p>
              <ul className="list-disc pl-5">
                {skipped.map((item) => (
                  <li key={item.line}>
                    Linha {item.line}: {item.problem}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending || toSave.length === 0}
            className={BUTTON}
          >
            {pending ? "Salvando…" : `Lançar ${toSave.length} operações`}
          </button>
        </>
      )}

      {result && (
        <p role="status" className="text-sm">
          {result.saved} operações salvas.
          {result.failed.length > 0 &&
            ` ${result.failed.length} não entraram: o motivo está na tabela.`}{" "}
          <Link href="/carteira" className="text-accent underline underline-offset-2">
            Ver minha carteira
          </Link>
        </p>
      )}
    </section>
  );
}
