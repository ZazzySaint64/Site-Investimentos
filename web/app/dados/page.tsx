import { Term } from "@/components/Term";
import { getAssets, getMacroSummary, getRuns, type JobRun } from "@/lib/data";
import {
  accumulatedFromMonthly,
  annualizedFromDaily,
  formatDate,
  formatDateTime,
  formatMonthYear,
  formatPercent,
  runSummary,
  statusLabel,
} from "@/lib/phrases";
import { AssetTable } from "./AssetTable";

export const metadata = { title: "Ativos | Site Investimentos" };

function MacroCard({
  label,
  value,
  phrase,
  note,
}: {
  label: React.ReactNode;
  value: string;
  phrase: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl">{value}</p>
      <p className="mt-1 text-sm text-text-soft">{phrase}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}

function RunDetails({ run }: { run: JobRun }) {
  const { rejected = [], failed = [], error } = run.details;
  const summary = runSummary(run.details);
  if (!rejected.length && !failed.length && !error) {
    return <span className="text-text-soft">{summary}</span>;
  }
  return (
    <details>
      <summary className="cursor-pointer text-text-soft">{summary}</summary>
      <ul className="mt-2 space-y-1 text-xs text-muted">
        {error && <li>{error}</li>}
        {failed.map((item) => (
          <li key={item}>Não atualizado: {item}</li>
        ))}
        {rejected.map((item) => (
          <li key={`${item.ticker}-${item.date}`}>
            {item.ticker}, {formatDate(item.date)}: {item.reason}
          </li>
        ))}
      </ul>
    </details>
  );
}

export default async function DataPage() {
  const [assets, macro, runs] = await Promise.all([getAssets(), getMacroSummary(), getRuns()]);
  const lastFinished = runs.find((run) => run.finished_at);
  const inflation = accumulatedFromMonthly(macro.ipca.map((point) => point.value));
  const latestIpca = macro.ipca[0];

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Ativos</h1>
        <p className="text-sm text-text-soft">
          Veja como cada investimento se comportou e clique em um deles para entender melhor. Toque
          nas palavras sublinhadas para ver o que significam.
        </p>
        <p className="text-xs text-muted">
          {lastFinished?.finished_at
            ? `Dados atualizados em ${formatDateTime(lastFinished.finished_at)}.`
            : "Os dados ainda não foram atualizados."}
        </p>
      </header>

      <section aria-labelledby="macro" className="space-y-3">
        <h2 id="macro" className="text-sm font-medium text-muted">
          Para comparar: juros e inflação do Brasil
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <MacroCard
            label={<Term name="selic">Selic</Term>}
            value={`${formatPercent(annualizedFromDaily(macro.selic.value))} ao ano`}
            phrase="Taxa básica de juros do país."
            note={`Referência: ${formatDate(macro.selic.date)}`}
          />
          <MacroCard
            label={<Term name="cdi">CDI</Term>}
            value={`${formatPercent(annualizedFromDaily(macro.cdi.value))} ao ano`}
            phrase="Régua da renda fixa. Serve para saber se um investimento rendeu bem."
            note={`Referência: ${formatDate(macro.cdi.date)}`}
          />
          <MacroCard
            label={<Term name="ipca">Inflação (IPCA)</Term>}
            value={`${formatPercent(inflation)} em 12 meses`}
            phrase="Quanto os preços subiram. Render menos que isso é perder poder de compra."
            note={`Até ${formatMonthYear(latestIpca.date)}`}
          />
        </div>
      </section>

      <section aria-labelledby="assets" className="space-y-3">
        <h2 id="assets" className="text-sm font-medium text-muted">
          Escolha um ativo
        </h2>
        <AssetTable assets={assets} />
      </section>

      <section aria-labelledby="runs" className="space-y-3">
        <h2 id="runs" className="text-sm font-medium text-muted">
          Atualizações automáticas
        </h2>
        <p className="text-sm text-text-soft">
          Toda noite o site busca os dados novos. Aqui fica o resultado das últimas vezes.
        </p>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {runs.map((run) => (
            <li key={run.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[11rem_13rem_1fr]">
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
