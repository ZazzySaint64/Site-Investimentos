import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DataDate } from "@/components/DataFreshness";
import { Term } from "@/components/Term";
import { getAssets, getDemoPersonas, getDemoTransactions, getPrices, type AssetRow } from "@/lib/data";
import type { GlossaryKey } from "@/lib/glossary";
import {
  CLASS_LABELS,
  drawdownPhrase,
  formatMoney,
  formatMonthYear,
  formatPercent,
  formatSignedPercent,
  resultPhrase,
  returnPhrase,
  volatilityPhrase,
} from "@/lib/phrases";
import { computePortfolio } from "@/lib/portfolio";
import { lastYears, linePoints, type PricePoint } from "@/lib/price-line";
import { SpecimenPicker } from "./SpecimenPicker";

const PLACES = [
  {
    title: "Carteira de exemplo",
    text: "Pessoas fictícias e preços reais, sem precisar criar conta.",
    href: "/demo/ana",
  },
  {
    title: "Todos os ativos",
    text: "Ações, fundos imobiliários e Tesouro Direto, com busca por nome.",
    href: "/dados",
  },
  {
    title: "Sua própria carteira",
    text: "Lance compras e vendas e veja o resultado. Só você vê os seus dados.",
    href: "/carteira",
  },
  {
    title: "Glossário",
    text: "Toda palavra sublinhada abre aqui, com uma explicação curta.",
    href: "/glossario",
  },
];

const COMING = "Em construção: simulações do futuro, sempre como faixa de possibilidades, e um assistente de IA que só afirma o que os dados mostram.";

const SLIP = [
  {
    when: "Toda madrugada",
    rows: [
      ["Preços de ações e fundos", "Yahoo Finance"],
      ["Títulos do Tesouro", "Tesouro Transparente"],
      ["Juros e inflação", "Banco Central"],
    ],
  },
  {
    when: "Logo depois",
    rows: [
      ["Retorno e oscilação", "calculados aqui"],
      ["Uma frase para cada número", "sem jargão"],
    ],
  },
  {
    when: "Quando você abre",
    rows: [["Data da última atualização", "em cada tela"]],
  },
];

const KINDS: { assetClass: string; preferred: string; label: string; term: GlossaryKey; kind: string }[] = [
  { assetClass: "acao_br", preferred: "PETR4", label: "Uma ação", term: "acao", kind: "Ação" },
  { assetClass: "fii", preferred: "HGLG11", label: "Um fundo imobiliário", term: "fii", kind: "Fundo imobiliário" },
  { assetClass: "tesouro", preferred: "TD-IPCA-20350515", label: "Um título do Tesouro", term: "tesouro", kind: "Tesouro Direto" },
];

function SheetRow({
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
    <div className="grid gap-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-baseline sm:gap-6">
      <div>
        <dt className="text-sm text-muted">
          <Term name={term}>{label}</Term>
        </dt>
        <dd className="text-3xl font-semibold tabular-nums">{value}</dd>
      </div>
      <dd>{phrase}</dd>
    </div>
  );
}

/** The evidence beside the numbers: how the price really moved in the period they describe. */
function PriceLine({ prices, name, withProventos }: { prices: PricePoint[]; name: string; withProventos: boolean }) {
  const first = prices[0];
  const last = prices.at(-1);
  if (!first || !last || prices.length < 2) return null;
  const from = `${formatMoney(first.close)} em ${formatMonthYear(first.date)}`;
  const to = `${formatMoney(last.close)} em ${formatMonthYear(last.date)}`;
  return (
    <figure className="space-y-2">
      <svg
        viewBox="0 0 600 96"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Preço de ${name}: de ${from} para ${to}.`}
        className="h-24 w-full overflow-visible"
      >
        <polyline
          points={linePoints(prices.map((point) => point.close), 600, 96)}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className="flex flex-wrap justify-between gap-x-4 text-sm tabular-nums text-text-soft">
        <span>{from}</span>
        <span>{to}</span>
      </figcaption>
      <p className="text-sm text-muted">
        Preço de fechamento{withProventos ? ", sem contar proventos" : ""}.
      </p>
    </figure>
  );
}

function Sheet({ asset, kind, prices }: { asset: AssetRow; kind: (typeof KINDS)[number]; prices: PricePoint[] }) {
  const stats = asset.asset_stats;
  const annual = stats?.return_annual ?? null;
  const volatility = stats?.volatility ?? null;
  const drawdown = stats?.max_drawdown ?? null;
  return (
    <article data-ui aria-label={`Ficha de ${asset.name}`} className="space-y-6 rounded-lg bg-paper p-5 sm:p-8">
      <header>
        <p className="text-sm text-muted">
          <Term name={kind.term}>{kind.kind}</Term>
        </p>
        <h3 className="font-display mt-1 text-3xl leading-tight">{asset.name}</h3>
      </header>
      <PriceLine prices={prices} name={asset.name} withProventos={asset.class !== "tesouro"} />
      <dl className="space-y-5">
        <SheetRow
          term="retorno"
          label="Retorno ao ano"
          value={formatSignedPercent(annual)}
          phrase={returnPhrase(annual, asset.class !== "tesouro")}
        />
        <SheetRow
          term="volatilidade"
          label="Oscilação"
          value={formatPercent(volatility)}
          phrase={volatilityPhrase(volatility)}
        />
        <SheetRow
          term="queda"
          label="Maior queda"
          value={formatSignedPercent(drawdown)}
          phrase={drawdownPhrase(drawdown)}
        />
      </dl>
      <Link
        href={`/dados/${encodeURIComponent(asset.ticker)}`}
        className="inline-block font-semibold text-accent underline-offset-2 hover:underline"
      >
        Ver a página completa
      </Link>
    </article>
  );
}

/** What the main button opens, with today's numbers, so the visitor knows what they will get. */
async function ExampleWallet() {
  await connection();
  const data = await Promise.all([getDemoPersonas(), getDemoTransactions("ana")]).catch(() => null);
  const persona = data?.[0].find((item) => item.slug === "ana");
  if (!data || !persona) return null;
  const portfolio = computePortfolio(data[1]);
  return (
    <aside
      data-ui
      aria-label={`Exemplo: carteira de ${persona.name}`}
      className="rise-on-load rise-on-load-2 space-y-4 rounded-lg bg-surface p-5 text-text sm:p-6"
    >
      <p className="text-sm text-muted">Carteira de {persona.name}, um exemplo fictício</p>
      <div>
        <p className="text-sm text-muted">Valor hoje</p>
        <p className="text-4xl font-semibold tabular-nums">{formatMoney(portfolio.value)}</p>
        <p className="mt-1">{resultPhrase(portfolio.result)}</p>
      </div>
      <ul className="space-y-3 text-sm">
        {portfolio.allocation.map((item) => (
          <li key={item.assetClass}>
            <span className="flex justify-between gap-3">
              <span>{CLASS_LABELS[item.assetClass] ?? item.assetClass}</span>
              <span className="tabular-nums">{formatPercent(item.share)}</span>
            </span>
            <span className="mt-1 block h-2 rounded-full bg-border">
              <span className="block h-2 rounded-full bg-accent" style={{ width: `${item.share * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// Reads the database at request time, so the rest of the page stays prerendered.
async function Specimens() {
  const assets = await getAssets().catch(() => null);
  if (!assets) {
    return (
      <p className="text-text-soft">
        Os dados não abriram agora. A <Link href="/demo/ana" className="text-accent underline">carteira de exemplo</Link>{" "}
        mostra como isso funciona.
      </p>
    );
  }
  const chosen = KINDS.flatMap((kind) => {
    const ofClass = assets.filter((asset) => asset.class === kind.assetClass);
    const asset =
      ofClass.find((item) => item.ticker === kind.preferred) ??
      ofClass.find((item) => item.asset_stats?.return_annual != null);
    return asset ? [{ kind, asset }] : [];
  });
  const specimens = await Promise.all(
    chosen.map(async ({ kind, asset }) => {
      // Without prices the sheet still has its numbers and sentences.
      const prices = await getPrices(asset.ticker).catch(() => []);
      return {
        key: kind.assetClass,
        label: kind.label,
        sheet: <Sheet asset={asset} kind={kind} prices={lastYears(prices)} />,
      };
    }),
  );
  return <SpecimenPicker specimens={specimens} />;
}

async function AssetCount() {
  const assets = await getAssets().catch(() => null);
  if (!assets) return null;
  return <span>{assets.length} ativos acompanhados.</span>;
}

export default function Home() {
  return (
    <main>
      <section className="overflow-hidden">
        <div className="on-forest relative bg-forest text-mist lg:min-h-[max(56svh,27vw)] lg:pb-24">
          <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-8 sm:pt-20">
            <h1 className="rise-on-load text-[11.4vw] leading-[0.95] sm:text-[7.2vw] 2xl:text-[7.75rem]">
              Investir em
              <br />
              palavras simples
            </h1>
          </div>
          <div className="relative z-10 mx-auto mt-8 -mb-12 max-w-md px-4 sm:px-8 lg:absolute lg:right-[max(2rem,calc((100vw-84rem)/2+2rem))] lg:-bottom-[5vw] lg:m-0 lg:w-[28vw] lg:max-w-none lg:px-0 2xl:w-[26rem]">
            <Suspense fallback={<div className="h-80 rounded-lg bg-forest-soft/20" />}>
              <ExampleWallet />
            </Suspense>
          </div>
        </div>
        <div className="bg-lime text-forest">
          <div className="mx-auto max-w-6xl space-y-4 px-4 pt-20 pb-8 sm:px-8 lg:pt-6 lg:pr-[38vw]">
            <p className="rise-on-load rise-on-load-2 max-w-[44ch] text-lg leading-snug sm:text-xl">
              Veja como cada investimento se comportou e o que os números querem dizer, com dados
              públicos e sem jargão.
            </p>
            <div className="rise-on-load rise-on-load-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href="/demo/ana"
                className="rounded-full bg-forest px-5 py-3 font-semibold text-lime hover:bg-accent"
              >
                Ver carteira de exemplo
              </Link>
              <Link href="/dados" className="font-semibold underline-offset-4 hover:underline">
                Explorar ativos
              </Link>
              <Link href="/entrar" className="font-semibold underline-offset-4 hover:underline">
                Criar minha carteira
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-2 text-sm [&_p]:text-forest">
              <Suspense fallback={null}>
                <AssetCount />
              </Suspense>
              <DataDate />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="ficha" className="mx-auto max-w-6xl space-y-10 px-4 py-20 sm:px-8 lg:py-36">
        <h2 id="ficha" className="reveal max-w-[20ch] text-[clamp(2.25rem,1.3rem+3.2vw,4rem)] leading-[1.02]">
          Todo número vem com uma frase
        </h2>
        <div className="reveal-2">
          <Suspense fallback={<div className="h-96 rounded-lg bg-mist" />}>
            <Specimens />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="lugares" className="bg-mist">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:py-36">
          <div className="space-y-6 lg:col-span-4">
            <h2 id="lugares" className="reveal text-[clamp(2.25rem,1.3rem+3.2vw,4rem)] leading-[1.02]">
              Por onde começar
            </h2>
            <p className="reveal-2 max-w-[44ch] text-text-soft">{COMING}</p>
          </div>
          <ul className="space-y-8 lg:col-span-8">
            {PLACES.map((place) => (
              <li key={place.href} className="reveal-2">
                <Link href={place.href} className="group block">
                  <span className="font-display block text-[clamp(2.25rem,1.3rem+3.2vw,4rem)] leading-[1.05] group-hover:text-accent">
                    {place.title}
                  </span>
                  <span className="mt-1 block text-lg text-text-soft">{place.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="origem" className="on-forest bg-forest text-mist">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:py-36">
          <div className="min-w-0 space-y-6 lg:col-span-5">
            <h2 id="origem" className="reveal text-[clamp(2.25rem,1.3rem+3.2vw,4rem)] leading-[1.02]">
              De onde vêm os números
            </h2>
            <p className="reveal-2 max-w-[40ch] text-lg">
              O site só lê dados públicos e não vende nada. Toda noite, um programa busca o que há
              de novo, recalcula as contas e deixa tudo pronto para você ler de manhã.
            </p>
          </div>
          <div className="reveal-2 min-w-0 lg:col-span-5 lg:col-start-7">
            <div className="zigzag bg-paper p-6 pb-10 text-text tabular-nums sm:p-8 sm:pb-12">
              {SLIP.map((group) => (
                <div key={group.when} className="mb-7">
                  <h3 className="mb-3 font-bold">{group.when}</h3>
                  <ul className="space-y-2">
                    {group.rows.map(([what, where]) => (
                      <li key={what} className="flex items-baseline gap-2">
                        <span>{what}</span>
                        <span aria-hidden="true" className="hidden w-0 min-w-4 flex-1 overflow-hidden whitespace-nowrap text-muted sm:block">
                          ..................................................
                        </span>
                        <span className="ml-auto shrink-0 text-right text-text-soft">{where}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="-mx-6 bg-forest px-6 py-3 font-semibold text-paper sm:-mx-8 sm:px-8">
                Você lê o número e o que ele quer dizer
              </p>
            </div>
          </div>
        </div>
      </section>

      <Link href="/entrar" className="group block bg-lime text-forest hover:bg-forest hover:text-lime">
        <section aria-labelledby="comecar" className="mx-auto flex min-h-[46svh] max-w-6xl flex-col justify-between gap-10 px-4 py-6 sm:px-8 lg:min-h-[60svh]">
          <div className="flex items-start justify-between gap-6">
            <p className="max-w-[36ch] text-lg sm:text-xl">
              Crie sua carteira com e-mail e senha. É de graça, e só você vê os seus dados.
            </p>
            <svg viewBox="0 0 48 48" aria-hidden="true" className="size-8 shrink-0 fill-none stroke-current stroke-[3] sm:size-12">
              <path d="M10 38 38 10M14 10h24v24" />
            </svg>
          </div>
          <h2 id="comecar" className="pb-[3vw] text-[22vw] leading-[0.95] 2xl:pb-10 2xl:text-[20rem]">
            Começar
          </h2>
        </section>
      </Link>
    </main>
  );
}
