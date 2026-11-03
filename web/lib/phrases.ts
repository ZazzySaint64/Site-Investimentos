// Formats and plain-language sentences. Pure functions, so they run in the server and in the browser.

const MISSING = "—";
const SHORT_HISTORY = "Histórico curto: menos de 12 meses.";
const NO_DATA = "Sem dados suficientes.";

const percentFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const moneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPercent(value: number | null): string {
  return value === null ? MISSING : `${percentFormat.format(value * 100)}%`;
}

export function formatSignedPercent(value: number | null): string {
  if (value === null) return MISSING;
  const size = percentFormat.format(Math.abs(value) * 100);
  if (size === percentFormat.format(0)) return `${size}%`;
  return `${value < 0 ? "−" : "+"}${size}%`;
}

export function formatMoney(value: number | null): string {
  return value === null ? MISSING : moneyFormat.format(value);
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(isoDateTime));
}

export function returnPhrase(value: number | null): string {
  if (value === null) return SHORT_HISTORY;
  const size = formatPercent(Math.abs(value));
  return value < 0
    ? `Em média, caiu ${size} por ano em até 5 anos de histórico, contando proventos.`
    : `Em média, subiu ${size} por ano em até 5 anos de histórico, contando proventos.`;
}

export const CLASS_LABELS: Record<string, string> = {
  acao_br: "Ação",
  fii: "Fundo imobiliário",
  tesouro: "Tesouro Direto",
  indice: "Índice",
};

export function formatSignedMoney(value: number | null): string {
  if (value === null) return MISSING;
  const size = moneyFormat.format(Math.abs(value));
  if (size === moneyFormat.format(0)) return size;
  return `${value < 0 ? "−" : "+"}${size}`;
}

export function formatQuantity(value: number): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function resultPhrase(result: number): string {
  const size = moneyFormat.format(Math.abs(result));
  if (size === moneyFormat.format(0)) return "A carteira nem ganhou nem perdeu até hoje.";
  return result < 0
    ? `A carteira perdeu ${size} até hoje, sem contar proventos.`
    : `A carteira ganhou ${size} até hoje, sem contar proventos.`;
}

const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

export function lastGoodFinish(
  runs: { status: string; finished_at: string | null }[],
): string | null {
  return runs.find((run) => run.status !== "failed" && run.finished_at)?.finished_at ?? null;
}

export function isStale(finishedAt: string, nowMs: number): boolean {
  return nowMs - Date.parse(finishedAt) > STALE_AFTER_MS;
}

export function riskLabel(volatility: number | null): string {
  if (volatility === null) return MISSING;
  if (volatility < 0.15) return "Baixa";
  return volatility < 0.3 ? "Média" : "Alta";
}

export function accumulatedFromMonthly(monthlyPercents: number[]): number {
  return monthlyPercents.reduce((total, percent) => total * (1 + percent / 100), 1) - 1;
}

export function formatMonthYear(isoDate: string): string {
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${months[Number(isoDate.slice(5, 7)) - 1]}/${isoDate.slice(0, 4)}`;
}

function yearsBefore(isoDate: string, years: number): string {
  return `${Number(isoDate.slice(0, 4)) - years}${isoDate.slice(4)}`;
}

/** What R$ 1.000 became over the last five years, or over the whole history if it is shorter. */
export function growthOfThousand(
  prices: { date: string; adj_close: number }[],
  cdi: { date: string; value: number }[],
): { since: string; asset: number; cdi: number | null } | null {
  const last = prices[prices.length - 1];
  if (!last || prices[0].date > yearsBefore(last.date, 1)) return null;
  const limit = yearsBefore(last.date, 5);
  const first = prices.find((point) => point.date >= limit) ?? prices[0];
  const days = cdi.filter((point) => point.date > first.date && point.date <= last.date);
  return {
    since: first.date,
    asset: (1000 * last.adj_close) / first.adj_close,
    cdi: days.length
      ? days.reduce((total, point) => total * (1 + point.value / 100), 1000)
      : null,
  };
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function runSummary(details: {
  failed?: string[];
  rejected?: unknown[];
  error?: string;
}): string {
  if (details.error) return "A atualização parou por um erro.";
  const parts = [];
  if (details.failed?.length) {
    const text = plural(details.failed.length, "item não foi atualizado", "itens não foram atualizados");
    parts.push(`${text}.`);
  }
  if (details.rejected?.length) {
    const text = plural(
      details.rejected.length,
      "preço com erro na fonte foi descartado",
      "preços com erro na fonte foram descartados",
    );
    parts.push(`${text}.`);
  }
  return parts.join(" ") || "Tudo foi atualizado.";
}

export function yearTicks(isoDates: string[]): string[] {
  if (new Set(isoDates.map((date) => date.slice(0, 4))).size < 3) return [];
  return isoDates.filter(
    (date, index) => index > 0 && date.slice(0, 4) !== isoDates[index - 1].slice(0, 4),
  );
}

export function volatilityPhrase(value: number | null): string {
  if (value === null) return SHORT_HISTORY;
  if (value < 0.15) return "O preço oscila pouco.";
  if (value < 0.3) return "O preço tem oscilação moderada.";
  return "O preço oscila muito.";
}

export function sharpePhrase(value: number | null): string {
  if (value === null) return NO_DATA;
  if (value < 0) return "No período, rendeu menos que o CDI.";
  if (value < 1) return "No período, ficou acima do CDI, mas pouco para o risco que teve.";
  return "No período, ficou bem acima do CDI para o risco que teve.";
}

export function drawdownPhrase(value: number | null): string {
  if (value === null) return NO_DATA;
  return `Do pico ao fundo, a maior queda foi de ${formatPercent(Math.abs(value))}.`;
}

export function correlationPhrase(value: number | null): string {
  if (value === null) return NO_DATA;
  if (value >= 0.7) return "Costuma andar junto com o Ibovespa.";
  if (value >= 0.3) return "Acompanha o Ibovespa em parte.";
  return "Tem pouca relação com o Ibovespa.";
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    success: "✓ Tudo certo",
    partial: "! Concluído com avisos",
    failed: "✕ Falhou",
    running: "… Em andamento",
  };
  return labels[status] ?? status;
}

export function annualizedFromDaily(dailyPercent: number): number {
  return (1 + dailyPercent / 100) ** 252 - 1;
}
