"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { inSavingOrder } from "@/lib/b3-extract";
import { requireUser } from "@/lib/supabase/server";
import {
  addFixedIncome,
  addTransaction,
  deleteFixedIncome,
  deleteTransaction,
} from "@/lib/wallet";

/** On failure the typed values come back, because React clears the form when an action ends. */
export type FormState = { message: string; values: Record<string, string> } | null;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function typed(formData: FormData, names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, text(formData, name)]));
}

function finish(result: ActionResult, values: Record<string, string>): FormState {
  if (!result.ok) return { message: result.message, values };
  revalidatePath("/carteira", "layout");
  return null;
}

export async function addTransactionAction(_state: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const values = typed(formData, ["ticker", "type", "quantity", "price", "date"]);
  const result = await addTransaction({
    ticker: values.ticker.trim().toUpperCase(),
    type: values.type === "sell" ? "sell" : "buy",
    quantity: Number(values.quantity),
    price: Number(values.price),
    date: values.date === "" ? null : values.date,
  });
  return finish(result, values);
}

export async function addFixedIncomeAction(_state: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const values = typed(formData, ["name", "principal", "cdi_pct", "start_date", "maturity"]);
  const daily = formData.get("daily_liquidity") === "on";
  const result = await addFixedIncome({
    name: values.name.trim(),
    principal: Number(values.principal),
    cdi_pct: Number(values.cdi_pct),
    start_date: values.start_date === "" ? null : values.start_date,
    maturity: values.maturity === "" ? null : values.maturity,
    daily_liquidity: daily,
  });
  return finish(result, daily ? { ...values, daily_liquidity: "on" } : values);
}

export async function deleteTransactionAction(id: number): Promise<FormState> {
  await requireUser();
  return finish(await deleteTransaction(id), {});
}

export async function deleteFixedIncomeAction(id: number): Promise<FormState> {
  await requireUser();
  return finish(await deleteFixedIncome(id), {});
}

export type ImportRow = { line: number; ticker: string; type: "buy" | "sell"; quantity: number; price: number; date: string };
export type ImportResult = { saved: number; failed: { line: number; message: string }[] };

const MAX_IMPORT = 2000;

function validRow(row: ImportRow): boolean {
  return (
    Number.isInteger(row?.line) &&
    typeof row.ticker === "string" &&
    /^[A-Z0-9]{4,12}$/.test(row.ticker) &&
    (row.type === "buy" || row.type === "sell") &&
    Number.isFinite(row.quantity) &&
    row.quantity > 0 &&
    Number.isFinite(row.price) &&
    row.price > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(row.date)
  );
}

/** Saves each row in date order, purchases first on the same day. A failed row does not stop the rest. */
export async function importTransactionsAction(rows: ImportRow[]): Promise<ImportResult> {
  await requireUser();
  if (!Array.isArray(rows) || rows.length > MAX_IMPORT || !rows.every(validRow)) {
    return { saved: 0, failed: [{ line: 0, message: `Arquivo inválido ou com mais de ${MAX_IMPORT} linhas.` }] };
  }
  const result: ImportResult = { saved: 0, failed: [] };
  // ponytail: one call per row, not atomic; a database function would save all or nothing
  for (const row of inSavingOrder(rows)) {
    const outcome = await addTransaction(row);
    if (outcome.ok) result.saved++;
    else result.failed.push({ line: row.line, message: outcome.message });
  }
  if (result.saved) revalidatePath("/carteira", "layout");
  return result;
}
