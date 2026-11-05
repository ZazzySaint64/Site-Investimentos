import { Metric } from "@/components/Metric";
import { Term } from "@/components/Term";
import {
  KINDS,
  MIN_HOLDERS_FOR_EXEMPTION,
  PARTS,
  adminFee,
  amortizationMonths,
  dividendPhrase,
  dividendYield,
  fundKind,
  leaseBands,
  priceToBook,
  priceToBookPhrase,
  type Dividend,
  type FiiMonth,
  type FiiQuarter,
} from "@/lib/fii";
import { formatDate, formatMonthYear, formatPercent } from "@/lib/phrases";

const BUILDING_KINDS = new Set(["tijolo", "misto", "desenvolvimento"]);

/** One bar split by share, with the numbers written next to it, so color is never the only key. */
function SplitBar({ parts }: { parts: { label: string; share: number; color: string }[] }) {
  const shown = parts.filter((part) => part.share >= 0.005);
  return (
    <div className="space-y-3">
      <div aria-hidden="true" className="flex h-4 overflow-hidden rounded-full bg-mist">
        {shown.map((part) => (
          <span
            key={part.label}
            className="h-full border-r-2 border-surface last:border-r-0"
            style={{ width: `${part.share * 100}%`, background: part.color }}
          />
        ))}
      </div>
      <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {shown.map((part) => (
          <li key={part.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-sm"
              style={{ background: part.color }}
            />
            <span className="text-text-soft">{part.label}</span>
            <span className="ml-auto tabular-nums">{formatPercent(part.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const LEASE_COLORS = [
  "#a7d13a",
  "#7fae6a",
  "#3d7a5f",
  "var(--color-forest)",
  "var(--color-border)",
];

export function FundReport({
  months,
  quarter,
  dividends,
  price,
}: {
  months: FiiMonth[];
  quarter: FiiQuarter | null;
  dividends: Dividend[];
  price: { close: number; date: string } | null;
}) {
  const latest = months.at(-1);
  const kind = latest ? fundKind(latest) : null;
  const yieldInfo = dividendYield(dividends, price);
  const ratio = priceToBook(price?.close ?? null, latest?.book_value ?? null);
  const fee = adminFee(months);
  const returned = amortizationMonths(months);
  const holders = latest?.holders ?? null;
  const showBuildings = kind && BUILDING_KINDS.has(kind.kind) && quarter && quarter.buildings > 0;
  const leases = showBuildings ? leaseBands(quarter) : null;
  const mainPart = kind && PARTS.find((part) => part.key === kind.main);

  return (
    <section
      aria-labelledby="fundo"
      className="space-y-5 rounded-lg border border-border bg-surface p-5"
    >
      <header className="space-y-2">
        <h2 id="fundo" className="text-sm font-medium text-muted">
          O que este fundo tem
        </h2>
        {kind && latest ? (
          <>
            <p className="font-display text-2xl">
              Pela carteira, é um <Term name={KINDS[kind.kind].term}>{KINDS[kind.kind].label}</Term>
            </p>
            {kind.kind === "misto" && mainPart && (
              <p className="text-text-soft">
                A maior parte, {formatPercent(kind.share)}, está em {mainPart.label.toLowerCase()}.
              </p>
            )}
            <p className="max-w-2xl text-text-soft">{KINDS[kind.kind].risk}</p>
          </>
        ) : (
          <p className="text-text-soft">
            O fundo ainda não tem informe mensal na CVM ligado a este código.
          </p>
        )}
      </header>

      {latest && (
        <>
          <SplitBar
            parts={PARTS.map((part) => ({
              ...part,
              share: latest[part.key] ?? 0,
            }))}
          />
          <p className="text-xs text-muted">
            Divisão do total investido, no informe de {formatMonthYear(latest.month)} enviado à CVM.
            O rótulo é calculado pelo site: um tipo precisa de dois terços da carteira. Não é uma
            classificação oficial.
          </p>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          term="dividend_yield"
          label="Rendimentos em 12 meses"
          value={formatPercent(yieldInfo?.value ?? null)}
          phrase={dividendPhrase(yieldInfo, "cota")}
        />
        <Metric
          term="pvp"
          label="P/VP"
          value={ratio === null ? "—" : ratio.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
          phrase={priceToBookPhrase(ratio)}
        />
        <Metric
          term="cotistas"
          label="Cotistas"
          value={holders === null ? "—" : holders.toLocaleString("pt-BR")}
          phrase={
            holders === null
              ? "Não informado."
              : holders >= MIN_HOLDERS_FOR_EXEMPTION
                ? "Cumpre o mínimo de 100 cotistas, uma das condições para o rendimento ser isento para pessoa física."
                : "Abaixo de 100 cotistas: o rendimento não é isento para pessoa física."
          }
        />
      </div>

      {showBuildings && (
        <div className="space-y-3">
          <h3 className="font-medium">Os imóveis</h3>
          <p className="text-sm text-text-soft">
            {quarter.buildings} {quarter.buildings === 1 ? "imóvel" : "imóveis"} para renda no
            informe trimestral de {formatDate(quarter.quarter)}.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric
              term="vacancia"
              label="Vacância física"
              value={formatPercent(quarter.vacancy)}
              phrase={
                quarter.vacancy_doubtful
                  ? "O número enviado à CVM não combina com a receita dos imóveis, então não o mostramos."
                  : quarter.vacancy === null
                    ? "Não informado."
                    : "Parte da área dos imóveis que estava sem inquilino."
              }
            />
            <Metric
              term="inadimplencia"
              label="Inadimplência"
              value={formatPercent(quarter.default_rate)}
              phrase={
                quarter.default_rate === null
                  ? "Não informado."
                  : "Parte do aluguel devido que não foi paga no prazo, pesada pela receita de cada imóvel."
              }
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <Term name="wault">Quando os contratos acabam</Term>
              {leases
                ? `: ${formatPercent(leases[0].share)} da receita vem de contratos que terminam em até 1 ano.`
                : ": o fundo não informou os prazos à CVM."}
            </p>
            {leases && (
              <SplitBar
                parts={leases.map((band, index) => ({
                  ...band,
                  color: LEASE_COLORS[index],
                }))}
              />
            )}
          </div>
        </div>
      )}

      {kind && !showBuildings && (kind.kind === "papel" || kind.kind === "fundos") && (
        <p className="text-sm text-text-soft">
          <Term name="spread">Spread</Term>, <Term name="ltv">LTV</Term> e garantias de cada título
          não estão nos dados abertos da CVM. Ficam no relatório gerencial do fundo.
        </p>
      )}

      {latest && (
        <details className="text-sm">
          <summary className="cursor-pointer text-text-soft">Ver mais números do fundo</summary>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted">
                <Term name="valor_patrimonial">Valor patrimonial da cota</Term>
              </dt>
              <dd className="tabular-nums">
                {latest.book_value === null
                  ? "Não informado"
                  : latest.book_value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
              </dd>
            </div>
            <div>
              <dt className="text-muted">
                <Term name="taxa_administracao">Taxa de administração</Term>
              </dt>
              <dd>
                {fee
                  ? `${formatPercent(fee.value)} do patrimônio em ${fee.months} ${fee.months === 1 ? "mês" : "meses"}`
                  : "Não informada"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">
                <Term name="amortizacao">Amortização</Term>
              </dt>
              <dd>
                {returned
                  ? `Devolveu parte do capital em ${returned} ${returned === 1 ? "mês" : "meses"} do último ano. Isso não é rendimento.`
                  : "Nenhuma no último ano."}
              </dd>
            </div>
            {showBuildings && quarter.tenant_sectors.length > 0 && (
              <div>
                <dt className="text-muted">Inquilinos por setor, em parte da receita</dt>
                <dd>
                  <ul>
                    {quarter.tenant_sectors.map((item) => (
                      <li key={item.sector} className="flex gap-4">
                        <span>{item.sector}</span>
                        <span className="ml-auto tabular-nums">{formatPercent(item.share)}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-3 text-xs text-muted">
            Fonte: informes mensal e trimestral que o fundo envia à CVM, publicados como dados
            abertos. Os informes chegam com atraso de um a três meses. Rendimentos vêm do Yahoo
            Finance.
          </p>
        </details>
      )}
    </section>
  );
}
