import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DataDate } from "@/components/DataFreshness";
import { Term } from "@/components/Term";
import { getAssets, type AssetRow } from "@/lib/data";
import type { GlossaryKey } from "@/lib/glossary";
import { CLASS_PLATES, PLATES } from "@/lib/plates";
import { formatPercent, riskLabel, returnPhrase, volatilityPhrase } from "@/lib/phrases";
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
  { assetClass: "tesouro", preferred: "", label: "Um título do Tesouro", term: "tesouro", kind: "Tesouro Direto" },
];

function Sheet({ asset, kind }: { asset: AssetRow; kind: (typeof KINDS)[number] }) {
  const plate = CLASS_PLATES[asset.class];
  const annual = asset.asset_stats?.return_annual ?? null;
  const volatility = asset.asset_stats?.volatility ?? null;
  return (
    <article
      data-ui
      aria-label={`Ficha de ${asset.name}`}
      className="absolute top-4 left-4 w-[min(560px,calc(100%-2rem))] rounded-lg bg-paper p-3 sm:top-10 sm:left-10 lg:left-16"
    >
      <Image
        src={plate.src}
        width={plate.width}
        height={plate.height}
        sizes="(min-width: 640px) 540px, 90vw"
        alt={`Prancha botânica antiga de ${plate.plant}.`}
        className="aspect-[5/4] w-full rounded-md object-cover object-[50%_30%]"
      />
      <div className="space-y-3 px-3 pt-4 pb-4">
        <p className="text-sm text-muted">
          <Term name={kind.term}>{kind.kind}</Term>
        </p>
        <h3 className="font-display text-3xl leading-tight">{asset.name}</h3>
        <p className="text-4xl font-semibold tabular-nums">
          {formatPercent(annual)}
          <span className="ml-2 text-base font-normal text-muted">ao ano, em média</span>
        </p>
        <p>{returnPhrase(annual, asset.class !== "tesouro")}</p>
        <p className="text-sm text-text-soft">
          <Term name="volatilidade">Oscilação</Term> {riskLabel(volatility).toLowerCase()}.{" "}
          {volatilityPhrase(volatility)}
        </p>
        <Link
          href={`/dados/${encodeURIComponent(asset.ticker)}`}
          className="inline-block font-semibold text-accent underline-offset-2 hover:underline"
        >
          Ver a página completa
        </Link>
      </div>
    </article>
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
  const specimens = KINDS.flatMap((kind) => {
    const ofClass = assets.filter((asset) => asset.class === kind.assetClass);
    const asset =
      ofClass.find((item) => item.ticker === kind.preferred) ??
      ofClass.find((item) => item.asset_stats?.return_annual != null);
    return asset ? [{ key: kind.assetClass, label: kind.label, sheet: <Sheet asset={asset} kind={kind} /> }] : [];
  });
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
        <div className="on-forest relative bg-forest pb-[66vw] text-mist sm:pb-36 lg:min-h-[62svh]">
          <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-8 sm:pt-20">
            <h1 className="rise-on-load text-[11.4vw] leading-[0.95] sm:text-[8vw] 2xl:text-[8.5rem]">
              Investir em
              <br />
              palavras simples
            </h1>
          </div>
          <div className="absolute right-[6vw] -bottom-10 z-10 w-[52vw] rotate-[5deg] sm:right-[7vw] sm:-bottom-36 sm:w-[28vw] 2xl:w-[26rem]">
            <div className="shutter overflow-hidden rounded-t-full">
              <Image
                src={PLATES.jaborandi.src}
                width={PLATES.jaborandi.width}
                height={PLATES.jaborandi.height}
                priority
                sizes="(min-width: 640px) 30vw, 55vw"
                alt="Prancha botânica antiga de jaborandi, planta nativa do Brasil, com folhas verdes e flores vermelhas."
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
          </div>
        </div>
        <div className="bg-lime text-forest">
          <div className="mx-auto max-w-6xl space-y-4 px-4 pt-16 pb-8 sm:px-8 sm:pt-6 sm:pr-[40vw]">
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
          <Suspense fallback={<div className="h-[70svh] rounded-lg bg-mist" />}>
            <Specimens />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="lugares" className="bg-mist">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:py-36">
          <div className="space-y-10 lg:col-span-8">
            <h2 id="lugares" className="reveal text-[clamp(2.25rem,1.3rem+3.2vw,4rem)] leading-[1.02]">
              Por onde começar
            </h2>
            <ul className="space-y-8">
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
            <p className="reveal max-w-[60ch] text-text-soft">{COMING}</p>
          </div>
          <div className="reveal-3 lg:col-span-4">
            <Image
              src={PLATES.cacau.src}
              width={PLATES.cacau.width}
              height={PLATES.cacau.height}
              sizes="(min-width: 1024px) 30vw, 90vw"
              alt="Prancha botânica antiga de cacau, com o fruto inteiro e aberto."
              className="max-h-[60svh] w-full rounded-t-full object-cover lg:sticky lg:top-8 lg:max-h-none"
            />
          </div>
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
            <Image
              src={PLATES.ipeca.src}
              width={PLATES.ipeca.width}
              height={PLATES.ipeca.height}
              sizes="(min-width: 1024px) 28vw, 90vw"
              alt="Prancha botânica antiga de ipeca, planta nativa do Brasil, com a raiz à mostra."
              className="reveal-3 aspect-[4/3] w-full max-w-md rounded-lg object-cover object-[50%_75%]"
            />
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
