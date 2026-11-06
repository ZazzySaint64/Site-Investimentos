import Link from "next/link";
import { CheckForm } from "@/components/CheckForm";
import { ExternalSources } from "@/components/ExternalSources";
import { Term } from "@/components/Term";
import { findAssets } from "@/lib/check";
import {
  getAssets,
  getCdiHistory,
  getDividends,
  getFiiReports,
  getPrices,
  type AssetRow,
} from "@/lib/data";
import { dividendPhrase, dividendYield, fundKind, KINDS } from "@/lib/fii";
import type { GlossaryKey } from "@/lib/glossary";
import {
  drawdownPhrase,
  formatDate,
  formatMonthYear,
  formatMoney,
  formatPercent,
  formatSignedPercent,
  growthOfThousand,
  paysCoupons,
  returnPhrase,
  volatilityPhrase,
} from "@/lib/phrases";

// The answer depends on what was typed and on the database.
export const instant = false;

export const metadata = { title: "Conferir um investimento | Site Investimentos" };

const EXAMPLES = ["MXRF11", "PETR4", "HGLG11"];

type Props = { searchParams: Promise<{ ativo?: string }> };

function Question({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-3 rounded-lg border border-border bg-surface p-5 sm:p-6"
    >
      <h2 id={id} className="font-display text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Fact({
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
    <div>
      <p className="text-xs text-muted">
        <Term name={term}>{label}</Term>
      </p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-text-soft">{phrase}</p>
    </div>
  );
}

function whatItIs(
  asset: AssetRow,
  fii: ReturnType<typeof fundKind>,
): { term: GlossaryKey; text: string } {
  if (asset.class === "fii" && fii) {
    return {
      term: KINDS[fii.kind].term,
      text: `Fundo imobiliário. Pela carteira que informou à CVM, é um ${KINDS[fii.kind].label}: ${KINDS[fii.kind].risk.charAt(0).toLowerCase()}${KINDS[fii.kind].risk.slice(1)}`,
    };
  }
  if (asset.class === "fii") {
    return {
      term: "fii",
      text: "Fundo imobiliário, que investe em imóveis ou em títulos ligados a imóveis.",
    };
  }
  if (asset.class === "tesouro") {
    const until = asset.maturity ? `, que vence em ${formatDate(asset.maturity)}` : "";
    return { term: "tesouro", text: `Título da dívida do governo federal${until}.` };
  }
  if (asset.class === "indice") {
    return {
      term: "ibovespa",
      text: "Um índice, que serve de comparação. Não pode ser comprado diretamente.",
    };
  }
  return {
    term: "acao",
    text: `Uma parte da empresa ${asset.name}, negociada na bolsa. Quem tem a ação ganha se a empresa for bem e o preço subir, e perde no caso contrário.`,
  };
}

function whatCanGoWrong(asset: AssetRow): { term: GlossaryKey; text: string } {
  if (asset.class === "tesouro") {
    return asset.ticker.startsWith("TD-SELIC-")
      ? {
          term: "tesouro",
          text: "Acompanha a Selic, então o preço oscila pouco. O risco de não pagar é o do governo federal, e o título não tem garantia do FGC.",
        }
      : {
          term: "marcacao_mercado",
          text: "Quem fica até o vencimento recebe o combinado. Quem vende antes recebe o preço do dia, que pode ser menor que o pago, porque o preço reage aos juros. Não tem garantia do FGC.",
        };
  }
  if (asset.class === "fii") {
    return {
      term: "fgc",
      text: "A cota oscila todo dia, e para sair é preciso vender a outra pessoa na bolsa. O rendimento pode cair. Não tem garantia do FGC.",
    };
  }
  return {
    term: "fgc",
    text: "O preço depende do resultado da empresa e do humor do mercado, e pode cair muito por anos. Não tem garantia do FGC.",
  };
}

async function Answer({ asset }: { asset: AssetRow }) {
  const hasIncome = asset.class === "acao_br" || asset.class === "fii";
  const [prices, cdi, dividends, fund] = await Promise.all([
    getPrices(asset.ticker),
    getCdiHistory(),
    hasIncome ? getDividends(asset.ticker) : Promise.resolve([]),
    asset.class === "fii" ? getFiiReports(asset.ticker) : Promise.resolve(null),
  ]);
  const stats = asset.asset_stats;
  const latestMonth = fund?.months.at(-1);
  const fii = latestMonth ? fundKind(latestMonth) : null;
  const coupons = paysCoupons(asset.ticker);
  const growth = asset.class === "indice" || coupons ? null : growthOfThousand(prices, cdi);
  const lastPrice = prices.at(-1);
  const yieldInfo = hasIncome ? dividendYield(dividends, asset.prices[0] ?? null) : null;
  const what = whatItIs(asset, fii);
  const risk = whatCanGoWrong(asset);
  const isTesouro = asset.class === "tesouro";

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <p className="text-sm text-muted">{isTesouro ? "Tesouro Direto" : asset.ticker}</p>
        <h1>{asset.name}</h1>
      </header>

      <Question id="o-que-e" title="O que é?">
        <p className="max-w-2xl">
          {what.text} <Term name={what.term}>Entenda o termo</Term>.
        </p>
      </Question>

      <Question id="o-que-pode-dar-errado" title="O que pode dar errado?">
        <p className="max-w-2xl">
          {risk.text} <Term name={risk.term}>Entenda o termo</Term>.
        </p>
        {asset.class !== "indice" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Fact
              term="queda"
              label="Maior queda no período"
              value={formatSignedPercent(stats?.max_drawdown ?? null)}
              phrase={drawdownPhrase(stats?.max_drawdown ?? null)}
            />
            <Fact
              term="volatilidade"
              label="Oscilação"
              value={formatPercent(stats?.volatility ?? null)}
              phrase={volatilityPhrase(stats?.volatility ?? null)}
            />
          </div>
        )}
      </Question>

      <Question id="como-foi" title="Como foi até aqui?">
        {growth ? (
          <p className="max-w-2xl">
            R$ 1.000 aplicados em {formatMonthYear(growth.since)} viraram{" "}
            <strong className="tabular-nums">{formatMoney(growth.asset)}</strong>
            {growth.cdi !== null && (
              <>
                , contra <strong className="tabular-nums">{formatMoney(growth.cdi)}</strong>{" "}
                rendendo 100% do <Term name="cdi">CDI</Term>
              </>
            )}
            .
          </p>
        ) : (
          <p className="text-text-soft">Sem histórico suficiente para esta conta.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {!coupons && asset.class !== "indice" && (
            <Fact
              term="retorno"
              label="Retorno ao ano"
              value={formatSignedPercent(stats?.return_annual ?? null)}
              phrase={returnPhrase(stats?.return_annual ?? null, !isTesouro)}
            />
          )}
          {hasIncome && (
            <Fact
              term="dividend_yield"
              label={asset.class === "fii" ? "Rendimentos em 12 meses" : "Proventos em 12 meses"}
              value={formatPercent(yieldInfo?.value ?? null)}
              phrase={dividendPhrase(yieldInfo, asset.class === "fii" ? "cota" : "ação")}
            />
          )}
        </div>
        <p className="text-sm text-muted">
          Tudo aqui é passado, sem impostos e custos. Não indica o que vai acontecer.
        </p>
      </Question>

      <Question id="fontes" title="De onde vêm os números?">
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-soft">
          {lastPrice && (
            <li>
              Preços:{" "}
              {isTesouro
                ? "Tesouro Transparente, do Tesouro Nacional"
                : "Yahoo Finance, a partir dos dados da B3"}
              , até {formatDate(lastPrice.date)}.
            </li>
          )}
          {hasIncome && (
            <li>
              Proventos: Yahoo Finance, pela data em que a ação ou cota deixou de dar direito a
              eles.
            </li>
          )}
          {latestMonth && (
            <li>
              Carteira do fundo: informe mensal de {formatMonthYear(latestMonth.month)} enviado à
              CVM.
              {fund?.quarter &&
                fund.quarter.buildings > 0 &&
                ` Imóveis: informe trimestral de ${formatDate(fund.quarter.quarter)}.`}
            </li>
          )}
          {cdi.length > 0 && (
            <li>
              CDI: Banco Central, série 12 do SGS, até {formatDate(cdi[cdi.length - 1].date)}. O
              número é calculado pela B3.
            </li>
          )}
          <li>Oscilação, maior queda e retorno: calculados pelo site com até 5 anos de preços.</li>
        </ul>
        <Link
          href={`/dados/${encodeURIComponent(asset.ticker)}`}
          className="inline-block font-semibold text-accent underline-offset-2 hover:underline"
        >
          Ver todos os números deste investimento
        </Link>
        <ExternalSources ticker={asset.ticker} assetClass={asset.class} />
      </Question>
    </div>
  );
}

export default async function CheckPage({ searchParams }: Props) {
  const [{ ativo = "" }, assets] = await Promise.all([searchParams, getAssets()]);
  const { exact, matches } = findAssets(assets, ativo);
  const options = assets.map(({ ticker, name }) => ({ ticker, name }));

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-8">
      <header className="space-y-3">
        {!exact && <h1>Conferir um investimento</h1>}
        <p className="max-w-2xl text-text-soft">
          Recebeu uma indicação? Veja o que o investimento é, o que pode dar errado e como foi até
          aqui, com dados públicos. O site não diz o que comprar.
        </p>
        <CheckForm
          defaultValue={exact?.class === "tesouro" ? exact.name : ativo}
          options={options}
        />
      </header>

      {exact && <Answer asset={exact} />}

      {!exact && matches.length > 0 && (
        <section aria-labelledby="resultados" className="space-y-2">
          <h2 id="resultados" className="text-sm font-medium text-muted">
            Qual destes?
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {matches.map((asset) => (
              <li key={asset.ticker}>
                <Link
                  href={`/conferir?ativo=${encodeURIComponent(asset.ticker)}`}
                  className="flex justify-between gap-4 p-4 hover:bg-paper"
                >
                  <span>{asset.name}</span>
                  {asset.class !== "tesouro" && (
                    <span className="tabular-nums text-muted">{asset.ticker}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!exact && matches.length === 0 && ativo.trim() && (
        <p role="status" className="rounded-lg border border-border bg-surface p-4">
          Não encontramos “{ativo}” entre os {assets.length} investimentos acompanhados pelo site.
          Confira o código, ou procure pelo nome.
        </p>
      )}

      {!ativo.trim() && (
        <p className="text-sm text-text-soft">
          Exemplos:{" "}
          {EXAMPLES.map((ticker, index) => (
            <span key={ticker}>
              {index > 0 && ", "}
              <Link
                href={`/conferir?ativo=${ticker}`}
                className="text-accent underline underline-offset-2"
              >
                {ticker}
              </Link>
            </span>
          ))}
          .
        </p>
      )}
    </main>
  );
}
