import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DataDate } from "@/components/DataFreshness";
import { Term } from "@/components/Term";
import { getAsset, getCdiHistory, getPrices } from "@/lib/data";
import type { GlossaryKey } from "@/lib/glossary";
import {
  COUPON_PHRASE,
  correlationPhrase,
  drawdownPhrase,
  formatDate,
  formatMonthYear,
  formatMoney,
  formatPercent,
  formatSignedPercent,
  growthOfThousand,
  paysCoupons,
  returnPhrase,
  sharpePhrase,
  volatilityPhrase,
} from "@/lib/phrases";
import { MyPosition } from "./MyPosition";
import { PriceChart } from "./PriceChart";

// Each ticker reads the database on request, so this page cannot be prerendered.
export const instant = false;

const CHART_POINT_STEP = 5;
const CLASS_TERMS: Record<string, { term: GlossaryKey; label: string }> = {
  acao_br: { term: "acao", label: "Ação" },
  fii: { term: "fii", label: "Fundo imobiliário" },
  tesouro: { term: "tesouro", label: "Tesouro Direto" },
  indice: { term: "ibovespa", label: "Índice" },
};

type Props = { params: Promise<{ ticker: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: `${decodeURIComponent((await params).ticker)} | Site Investimentos` };
}

function formatRatio(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function Metric({
  term,
  label,
  value,
  phrase,
}: {
  term: GlossaryKey;
  label: string;
  value: string;
  phrase: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted">
        <Term name={term}>{label}</Term>
      </p>
      <p className="mt-1 font-mono text-2xl">{value}</p>
      <p className="mt-1 text-sm text-text-soft">{phrase}</p>
    </div>
  );
}

export default async function AssetDataPage({ params }: Props) {
  const ticker = decodeURIComponent((await params).ticker);
  const [asset, prices, cdi] = await Promise.all([
    getAsset(ticker),
    getPrices(ticker),
    getCdiHistory(),
  ]);
  if (!asset) notFound();

  const stats = asset.asset_stats;
  const isIndex = asset.class === "indice";
  const isTesouro = asset.class === "tesouro";
  const coupons = paysCoupons(asset.ticker);
  const growth = isIndex || coupons ? null : growthOfThousand(prices, cdi);
  const chartPoints = prices.filter(
    (_, index) => index % CHART_POINT_STEP === 0 || index === prices.length - 1,
  );
  const classInfo = CLASS_TERMS[asset.class];

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <Link href="/dados" className="text-sm text-accent underline-offset-2 hover:underline">
          ← Todos os ativos
        </Link>
        <h1 className="text-2xl font-semibold">{asset.name}</h1>
        <p className="text-sm text-text-soft">
          <Term name={classInfo.term}>{classInfo.label}</Term>
          {asset.class !== "tesouro" && <span className="font-mono"> · {asset.ticker}</span>}
          {asset.sector && ` · ${asset.sector}`}
          {asset.maturity && ` · Vence em ${formatDate(asset.maturity)}`}
        </p>
        <DataDate />
      </header>

      <Suspense fallback={null}>
        <MyPosition ticker={ticker} />
      </Suspense>

      {growth && (
        <section
          aria-labelledby="exemplo"
          className="rounded-lg border border-border bg-surface p-5"
        >
          <h2 id="exemplo" className="text-sm font-medium text-muted">
            Na prática: R$ 1.000 aplicados em {formatMonthYear(growth.since)}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-3xl text-accent">{formatMoney(growth.asset)}</p>
              <p className="mt-1 text-sm text-text-soft">
                {isTesouro ? (
                  "hoje, neste título"
                ) : (
                  <>
                    hoje, neste ativo, contando <Term name="proventos">proventos</Term>
                  </>
                )}
              </p>
            </div>
            {growth.cdi !== null && (
              <div>
                <p className="font-mono text-3xl">{formatMoney(growth.cdi)}</p>
                <p className="mt-1 text-sm text-text-soft">
                  hoje, rendendo 100% do <Term name="cdi">CDI</Term>
                </p>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">
            Conta feita com os preços do passado, sem impostos e custos. Não indica o que vai
            acontecer daqui para frente.
          </p>
        </section>
      )}

      <section aria-labelledby="stats" className="space-y-3">
        <h2 id="stats" className="text-sm font-medium text-muted">
          O que os números dizem (até 5 anos de histórico)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            term="retorno"
            label="Retorno ao ano"
            value={coupons ? "—" : formatSignedPercent(stats?.return_annual ?? null)}
            phrase={
              coupons ? COUPON_PHRASE : returnPhrase(stats?.return_annual ?? null, !isTesouro)
            }
          />
          <Metric
            term="volatilidade"
            label="Oscilação"
            value={formatPercent(stats?.volatility ?? null)}
            phrase={volatilityPhrase(stats?.volatility ?? null)}
          />
          <Metric
            term="queda"
            label="Maior queda"
            value={formatSignedPercent(stats?.max_drawdown ?? null)}
            phrase={drawdownPhrase(stats?.max_drawdown ?? null)}
          />
          <Metric
            term="sharpe"
            label="Retorno pelo risco"
            value={coupons ? "—" : formatRatio(stats?.sharpe ?? null)}
            phrase={coupons ? COUPON_PHRASE : sharpePhrase(stats?.sharpe ?? null)}
          />
          {!isIndex && (
            <Metric
              term="correlacao"
              label="Relação com o Ibovespa"
              value={formatRatio(stats?.corr_benchmark ?? null)}
              phrase={correlationPhrase(stats?.corr_benchmark ?? null)}
            />
          )}
        </div>
      </section>

      <section aria-labelledby="chart" className="rounded-lg border border-border bg-surface p-4">
        <h2 id="chart" className="text-sm font-medium">
          Como o preço andou
        </h2>
        <p className="mb-4 text-sm text-text-soft">
          {prices.length
            ? `Preço de fechamento de ${formatDate(prices[0].date)} a ` +
              `${formatDate(prices[prices.length - 1].date)}. Não inclui proventos.`
            : "Ainda não há preços guardados."}
        </p>
        {prices.length > 0 && <PriceChart points={chartPoints} isIndex={isIndex} />}
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-text-soft">Ver os últimos 10 preços</summary>
          <table className="mt-2 w-full max-w-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th scope="col" className="py-1 font-medium">
                  Data
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  Preço
                </th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {prices
                .slice(-10)
                .reverse()
                .map((point) => (
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
    </main>
  );
}
