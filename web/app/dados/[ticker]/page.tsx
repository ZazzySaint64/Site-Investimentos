import Link from "next/link";
import { notFound } from "next/navigation";
import { getAsset, getPrices, getRuns } from "@/lib/data";
import {
  correlationPhrase,
  drawdownPhrase,
  formatDate,
  formatDateTime,
  formatMoney,
  formatPercent,
  formatSignedPercent,
  returnPhrase,
  sharpePhrase,
  volatilityPhrase,
} from "@/lib/phrases";
import { PriceChart } from "./PriceChart";

// Each ticker reads the database on request, so this page cannot be prerendered.
export const instant = false;

const CHART_POINT_STEP = 5;

type Props = { params: Promise<{ ticker: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: `${decodeURIComponent((await params).ticker)} | Site Investimentos` };
}

function Metric({ label, value, phrase }: { label: string; value: string; phrase: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl">{value}</p>
      <p className="mt-1 text-sm text-text-soft">{phrase}</p>
    </div>
  );
}

export default async function AssetDataPage({ params }: Props) {
  const ticker = decodeURIComponent((await params).ticker);
  const [asset, prices, runs] = await Promise.all([getAsset(ticker), getPrices(ticker), getRuns()]);
  if (!asset) notFound();

  const stats = asset.asset_stats;
  const lastFinished = runs.find((run) => run.finished_at);
  const isIndex = asset.class === "indice";
  const chartPoints = prices.filter(
    (_, index) => index % CHART_POINT_STEP === 0 || index === prices.length - 1,
  );
  const correlation = stats?.corr_benchmark ?? null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <Link href="/dados" className="text-sm text-accent underline-offset-2 hover:underline">
          ← Todos os ativos
        </Link>
        <h1 className="text-2xl font-semibold">
          <span className="font-mono">{asset.ticker}</span> · {asset.name}
        </h1>
        <p className="text-sm text-text-soft">
          {[asset.sector, asset.maturity && `Vence em ${formatDate(asset.maturity)}`]
            .filter(Boolean)
            .join(" · ")}
          {asset.sector || asset.maturity ? ". " : ""}
          {lastFinished?.finished_at &&
            `Dados atualizados em ${formatDateTime(lastFinished.finished_at)}.`}
        </p>
      </header>

      <section aria-labelledby="chart" className="rounded-lg border border-border bg-surface p-4">
        <h2 id="chart" className="text-sm font-medium">
          Preço de fechamento
        </h2>
        <p className="mb-4 text-sm text-text-soft">
          {prices.length
            ? `De ${formatDate(prices[0].date)} a ${formatDate(prices[prices.length - 1].date)}, ` +
              `${prices.length.toLocaleString("pt-BR")} pregões guardados. Sem proventos.`
            : "Ainda não há preços guardados."}
        </p>
        {prices.length > 0 && <PriceChart points={chartPoints} isIndex={isIndex} />}
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-text-soft">Ver os últimos 10 preços</summary>
          <table className="mt-2 w-full max-w-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th scope="col" className="py-1 font-medium">Data</th>
                <th scope="col" className="py-1 text-right font-medium">Preço</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {prices.slice(-10).reverse().map((point) => (
                <tr key={point.date}>
                  <td className="py-1">{formatDate(point.date)}</td>
                  <td className="py-1 text-right">
                    {isIndex ? point.close.toLocaleString("pt-BR") : formatMoney(point.close)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section aria-labelledby="stats" className="space-y-3">
        <h2 id="stats" className="text-sm font-medium text-muted">
          Estatísticas de até 5 anos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Retorno ao ano"
            value={formatSignedPercent(stats?.return_annual ?? null)}
            phrase={returnPhrase(stats?.return_annual ?? null)}
          />
          <Metric
            label="Oscilação (volatilidade)"
            value={formatPercent(stats?.volatility ?? null)}
            phrase={volatilityPhrase(stats?.volatility ?? null)}
          />
          <Metric
            label="Maior queda"
            value={formatSignedPercent(stats?.max_drawdown ?? null)}
            phrase={drawdownPhrase(stats?.max_drawdown ?? null)}
          />
          <Metric
            label="Retorno pelo risco (Sharpe)"
            value={stats?.sharpe == null ? "—" : stats.sharpe.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            phrase={sharpePhrase(stats?.sharpe ?? null)}
          />
          <Metric
            label="Relação com o Ibovespa"
            value={correlation === null ? "—" : correlation.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            phrase={correlationPhrase(correlation)}
          />
        </div>
      </section>
    </main>
  );
}
