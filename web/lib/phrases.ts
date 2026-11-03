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
  return `${value < 0 ? "−" : "+"}${percentFormat.format(Math.abs(value) * 100)}%`;
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
