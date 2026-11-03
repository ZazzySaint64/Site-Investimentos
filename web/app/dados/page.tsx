import { getAssets, getLatestMacro, getRuns, type JobRun, type MacroPoint } from "@/lib/data";
import {
  annualizedFromDaily,
  formatDate,
  formatDateTime,
  formatPercent,
  statusLabel,
} from "@/lib/phrases";
import { AssetTable } from "./AssetTable";

export const metadata = { title: "Dados | Site Investimentos" };

const MACRO_TEXT: Record<string, { label: string; phrase: string }> = {
  selic: { label: "Selic", phrase: "Taxa básica de juros do país, em ritmo de um ano." },
  cdi: { label: "CDI", phrase: "Referência da renda fixa, em ritmo de um ano." },
  ipca: { label: "IPCA", phrase: "Inflação oficial no último mês publicado." },
};

function macroValue({ series, value }: MacroPoint) {
  return series === "ipca" ? formatPercent(value / 100) : formatPercent(annualizedFromDaily(value));
}

function RunDetails({ run }: { run: JobRun }) {
  const { failed = [], rejected = [], skipped = [], error } = run.details;
  const notes = failed.length + rejected.length + skipped.length + (error ? 1 : 0);
  if (notes === 0) return <span className="text-muted">Sem avisos</span>;
  return (
    <details>
      <summary className="cursor-pointer text-text-soft">
        {failed.length} falhas, {rejected.length} preços rejeitados, {skipped.length} ignorados
      </summary>
      <ul className="mt-2 space-y-1 text-xs text-text-soft">
        {error && <li>Erro: {error}</li>}
        {failed.map((item) => (
          <li key={item}>Falhou: {item}</li>
        ))}
        {rejected.map((item) => (
          <li key={`${item.ticker}-${item.date}`}>
            {item.ticker} em {formatDate(item.date)}: {item.reason}
          </li>
        ))}
        {skipped.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}

export default async function DataPage() {
  const [assets, macro, runs] = await Promise.all([getAssets(), getLatestMacro(), getRuns()]);
  const lastFinished = runs.find((run) => run.finished_at);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Dados do mercado</h1>
        <p className="text-sm text-text-soft">
          {lastFinished?.finished_at
            ? `Dados atualizados em ${formatDateTime(lastFinished.finished_at)}.`
            : "Os dados ainda não foram atualizados."}{" "}
          Estatísticas olham o passado e não garantem resultado futuro.
        </p>
        <p className="text-xs text-muted">
          Projeto educativo e não comercial. Nada aqui é recomendação de investimento.
        </p>
      </header>

      <section aria-labelledby="macro" className="space-y-3">
        <h2 id="macro" className="text-sm font-medium text-muted">
          Juros e inflação
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {macro.map((point) => (
            <div key={point.series} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted">{MACRO_TEXT[point.series].label}</p>
              <p className="mt-1 font-mono text-2xl">{macroValue(point)}</p>
              <p className="mt-1 text-sm text-text-soft">{MACRO_TEXT[point.series].phrase}</p>
              <p className="mt-1 text-xs text-muted">Referência: {formatDate(point.date)}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="assets" className="space-y-3">
        <h2 id="assets" className="text-sm font-medium text-muted">
          Ativos acompanhados
        </h2>
        <AssetTable assets={assets} />
      </section>

      <section aria-labelledby="runs" className="space-y-3">
        <h2 id="runs" className="text-sm font-medium text-muted">
          Últimas atualizações automáticas
        </h2>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {runs.map((run) => (
            <li key={run.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[12rem_14rem_1fr]">
              <span className="font-mono text-text-soft">{formatDateTime(run.started_at)}</span>
              <span>{statusLabel(run.status)}</span>
              <RunDetails run={run} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
