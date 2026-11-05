// What a real estate fund holds and pays, from the reports it sends to CVM. Pure functions.

import type { GlossaryKey } from "./glossary.ts";

export type FiiMonth = {
  month: string;
  book_value: number | null;
  holders: number | null;
  admin_fee: number | null;
  amortization: number | null;
  share_buildings: number | null;
  share_development: number | null;
  share_paper: number | null;
  share_funds: number | null;
  share_other: number | null;
};

export type FiiQuarter = {
  quarter: string;
  buildings: number;
  vacancy: number | null;
  vacancy_doubtful: boolean;
  default_rate: number | null;
  lease_12m: number | null;
  lease_24m: number | null;
  lease_36m: number | null;
  lease_over_36m: number | null;
  lease_undetermined: number | null;
  tenant_sectors: { sector: string; share: number }[];
};

export type Dividend = { date: string; amount: number };

type ShareKey = "share_buildings" | "share_development" | "share_paper" | "share_funds";

export const PARTS: {
  key: ShareKey | "share_other";
  label: string;
  color: string;
}[] = [
  {
    key: "share_buildings",
    label: "Imóveis prontos",
    color: "var(--color-forest)",
  },
  {
    key: "share_development",
    label: "Imóveis em obra ou à venda",
    color: "#3d7a5f",
  },
  {
    key: "share_paper",
    label: "Títulos de crédito, como CRI",
    color: "#a7d13a",
  },
  { key: "share_funds", label: "Cotas de outros FIIs", color: "#9fbdb0" },
  { key: "share_other", label: "Caixa e outros", color: "var(--color-border)" },
];

export type FundKind = "tijolo" | "papel" | "fundos" | "desenvolvimento" | "misto";

const KIND_OF: Record<ShareKey, FundKind> = {
  share_buildings: "tijolo",
  share_development: "desenvolvimento",
  share_paper: "papel",
  share_funds: "fundos",
};

/** The ANBIMA cut for a fund's type, applied here to the real holdings instead of the mandate. */
export const KIND_CUT = 2 / 3;

export const KINDS: Record<FundKind, { label: string; term: GlossaryKey; risk: string }> = {
  tijolo: {
    label: "FII de tijolo",
    term: "fii_tijolo",
    risk: "É dono de imóveis e vive de aluguel. O risco principal é imóvel vazio ou inquilino que não paga.",
  },
  papel: {
    label: "FII de papel",
    term: "fii_papel",
    risk: "Empresta dinheiro ao setor imobiliário por meio de títulos, como CRI. Quem compra a cota empresta, indiretamente, a quem tomou esse crédito. O risco principal é o devedor não pagar.",
  },
  fundos: {
    label: "Fundo de fundos",
    term: "fundo_de_fundos",
    risk: "Compra cotas de outros fundos imobiliários. Diversifica, mas soma as taxas dele às dos outros fundos e herda os riscos de cada um.",
  },
  desenvolvimento: {
    label: "FII de desenvolvimento",
    term: "fii_desenvolvimento",
    risk: "Constrói imóveis para vender ou alugar. O resultado depende da obra, do prazo e das vendas, e a renda pode ser irregular.",
  },
  misto: {
    label: "FII híbrido",
    term: "fii_hibrido",
    risk: "Mistura tipos de ativo, e por isso soma os riscos de cada parte.",
  },
};

export function fundKind(
  month: FiiMonth,
): { kind: FundKind; main: ShareKey; share: number } | null {
  const ranked = (Object.keys(KIND_OF) as ShareKey[])
    .map((key) => ({ key, share: month[key] ?? 0 }))
    .sort((a, b) => b.share - a.share);
  const [first] = ranked;
  if (first.share <= 0) return null;
  return {
    kind: first.share >= KIND_CUT ? KIND_OF[first.key] : "misto",
    main: first.key,
    share: first.share,
  };
}

/** Cash paid in the 12 months up to the last price, over that price. Null without payments. */
export function dividendYield(
  dividends: Dividend[],
  price: { close: number; date: string } | null,
): { value: number; payments: number; total: number; since: string } | null {
  if (!price) return null;
  const end = new Date(`${price.date}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCFullYear(end.getUTCFullYear() - 1);
  const since = start.toISOString().slice(0, 10);
  const paid = dividends.filter((item) => item.date > since && item.date <= price.date);
  const total = paid.reduce((sum, item) => sum + item.amount, 0);
  // A fund with no payment in a year is far more likely missing data than paying nothing.
  if (total <= 0) return null;
  return { value: total / price.close, payments: paid.length, total, since };
}

export function priceToBook(price: number | null, bookValue: number | null): number | null {
  return price && bookValue && bookValue > 0 ? price / bookValue : null;
}

const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function priceToBookPhrase(value: number | null): string {
  if (value === null) return "Sem valor patrimonial informado.";
  const cents = `R$ ${decimal.format(value)}`;
  return (
    `O mercado paga ${cents} por R$ 1,00 de patrimônio contábil. ` +
    (value < 1
      ? "Abaixo de 1 não prova que está barato: os imóveis podem valer menos que a avaliação, ou o crédito pode estar pior."
      : "Acima de 1 não prova que está caro: a avaliação contábil pode estar defasada.")
  );
}

/** Admin fee of the last months that exist, up to 12, as a share of the fund's equity. */
export function adminFee(months: FiiMonth[]): { value: number; months: number } | null {
  const recent = months.slice(-12).filter((month) => month.admin_fee !== null);
  if (!recent.length) return null;
  return {
    value: recent.reduce((sum, month) => sum + month.admin_fee!, 0),
    months: recent.length,
  };
}

export function amortizationMonths(months: FiiMonth[]): number {
  return months.slice(-12).filter((month) => (month.amortization ?? 0) > 0).length;
}

export const MIN_HOLDERS_FOR_EXEMPTION = 100;

export const LEASE_BANDS: { key: keyof FiiQuarter; label: string }[] = [
  { key: "lease_12m", label: "Até 1 ano" },
  { key: "lease_24m", label: "1 a 2 anos" },
  { key: "lease_36m", label: "2 a 3 anos" },
  { key: "lease_over_36m", label: "Mais de 3 anos" },
  { key: "lease_undetermined", label: "Sem prazo definido" },
];

/** Share of each lease band within what was reported, so the bands add up to 100%. */
export function leaseBands(quarter: FiiQuarter): { label: string; share: number }[] | null {
  const values = LEASE_BANDS.map(({ key, label }) => ({
    label,
    share: quarter[key] as number | null,
  }));
  const total = values.reduce((sum, band) => sum + (band.share ?? 0), 0);
  if (values.some((band) => band.share === null) || total <= 0) return null;
  return values.map((band) => ({
    label: band.label,
    share: band.share! / total,
  }));
}

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function dividendPhrase(
  result: ReturnType<typeof dividendYield>,
  unit: "cota" | "ação",
): string {
  if (!result) return "Sem pagamentos registrados nos últimos 12 meses.";
  const [year, month, day] = result.since.split("-");
  const times = result.payments === 1 ? "1 pagamento" : `${result.payments} pagamentos`;
  return (
    `Pagou ${money.format(result.total)} por ${unit} em ${times} desde ${day}/${month}/${year}, ` +
    "em relação ao preço de hoje. Olha para o passado e sobe quando o preço cai."
  );
}
