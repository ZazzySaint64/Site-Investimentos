// Turns the rows of the B3 trading statement ("extrato de negociação") into purchases and sales.
// Pure. The file never leaves the browser: only the rows the person confirms are sent.

import type { Cell } from "./xlsx.ts";

export type Operation = {
  line: number; // line in the file, for the person to find it
  ticker: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
};

export type Skipped = { line: number; problem: string };

export type Extract =
  | { ok: true; operations: Operation[]; skipped: Skipped[] }
  | { ok: false; problem: string };

// The column names the statement uses, without accents and in lower case.
const COLUMNS = {
  date: ["data do negocio", "data"],
  type: ["tipo de movimentacao", "movimentacao", "compra/venda", "c/v"],
  market: ["mercado"],
  ticker: ["codigo de negociacao", "codigo", "ativo"],
  quantity: ["quantidade"],
  price: ["preco", "preco unitario"],
} as const;

const REQUIRED = ["date", "type", "ticker", "quantity", "price"] as const;

function plain(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** "15/03/2024" or an Excel day number to "2024-03-15". */
function toIsoDate(cell: Cell): string | null {
  if (typeof cell === "number") {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.round(cell) * 86_400_000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }
  const match = String(cell ?? "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

/** A number cell as it is; a text cell the Brazilian way ("R$ 1.234,56"). */
function toNumber(cell: Cell): number | null {
  if (typeof cell === "number") return cell;
  const text = String(cell ?? "").replace(/R\$|\s/g, "");
  if (!text) return null;
  const value = Number(text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text);
  return Number.isFinite(value) ? value : null;
}

// The fractional market adds an F to the code: ITUB4F is ITUB4.
function toTicker(cell: Cell): string {
  const code = String(cell ?? "").trim().toUpperCase();
  return /^[A-Z0-9]{4}\d{1,2}F$/.test(code) ? code.slice(0, -1) : code;
}

export function readExtract(rows: Cell[][]): Extract {
  const headerAt = rows.findIndex((row) =>
    row.some((cell) => typeof cell === "string" && COLUMNS.ticker.includes(plain(cell) as never)),
  );
  if (headerAt < 0) {
    return {
      ok: false,
      problem:
        "Não achei a coluna “Código de Negociação”. Confira se o arquivo é o extrato de negociação da B3.",
    };
  }
  const header = rows[headerAt].map((cell) => plain(String(cell ?? "")));
  const at = Object.fromEntries(
    Object.entries(COLUMNS).map(([key, names]) => [
      key,
      header.findIndex((name) => (names as readonly string[]).includes(name)),
    ]),
  ) as Record<keyof typeof COLUMNS, number>;
  const missing = REQUIRED.filter((key) => at[key] < 0);
  if (missing.length) {
    const found = rows[headerAt].filter((cell) => cell !== null && cell !== "").join(", ");
    return {
      ok: false,
      problem: `Faltam colunas que o site precisa (data, compra ou venda, código, quantidade e preço). Colunas encontradas: ${found}.`,
    };
  }

  const operations: Operation[] = [];
  const skipped: Skipped[] = [];
  rows.slice(headerAt + 1).forEach((row, index) => {
    const line = headerAt + index + 2;
    if (row.every((cell) => cell === null || cell === "")) return;
    const kind = plain(String(row[at.type] ?? ""));
    const type = kind.startsWith("compra") || kind === "c" ? "buy" : kind.startsWith("venda") || kind === "v" ? "sell" : null;
    const market = at.market >= 0 ? plain(String(row[at.market] ?? "")) : "";
    const date = toIsoDate(row[at.date]);
    const quantity = toNumber(row[at.quantity]);
    const price = toNumber(row[at.price]);
    const ticker = toTicker(row[at.ticker]);
    if (market && !market.includes("vista") && !market.includes("fracionario")) {
      skipped.push({ line, problem: `Mercado “${row[at.market]}” não entra na carteira do site.` });
    } else if (!type) {
      skipped.push({ line, problem: `Tipo “${row[at.type] ?? ""}” não é compra nem venda.` });
    } else if (!date || !ticker || !quantity || quantity <= 0 || price === null || price <= 0) {
      skipped.push({ line, problem: "Data, código, quantidade ou preço ilegível." });
    } else {
      operations.push({ line, ticker, type, quantity, price, date });
    }
  });
  return { ok: true, operations, skipped };
}

type Existing = { ticker: string; type: string; quantity: number; price: number; date: string };

const key = (item: Existing) =>
  `${item.ticker}|${item.type}|${item.date}|${item.quantity}|${item.price.toFixed(4)}`;

/** Which operations are already in the wallet, matched one to one, so a second import adds nothing. */
export function alreadySaved(operations: Operation[], existing: Existing[]): Set<number> {
  const left = new Map<string, number>();
  for (const item of existing) left.set(key(item), (left.get(key(item)) ?? 0) + 1);
  const saved = new Set<number>();
  for (const operation of operations) {
    const count = left.get(key(operation)) ?? 0;
    if (count > 0) {
      saved.add(operation.line);
      left.set(key(operation), count - 1);
    }
  }
  return saved;
}

/** Purchases before sales on the same day, so a day trade does not look like a short sale. */
export function inSavingOrder<T extends { date: string; type: string; line: number }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.type !== b.type ? (a.type === "buy" ? -1 : 1) : a.line - b.line,
  );
}
