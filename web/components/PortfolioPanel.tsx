import Link from "next/link";
import { Term } from "@/components/Term";
import type { Income } from "@/lib/income";
import type { Portfolio } from "@/lib/portfolio";
import {
  CLASS_LABELS,
  formatDate,
  formatMoney,
  formatMonthYear,
  formatPercent,
  formatQuantity,
  formatSignedMoney,
  formatSignedPercent,
  paysCoupons,
  priceNote,
  resultPhrase,
  todayInBrazil,
} from "@/lib/phrases";

export const PROFILE_LABELS: Record<string, string> = {
  conservador: "Perfil conservador",
  moderado: "Perfil moderado",
  arrojado: "Perfil arrojado",
};
const HEADER_CELL = "px-2 py-3 text-right font-medium sm:px-4";
const WIDE_HEADER_CELL = `${HEADER_CELL} hidden lg:table-cell`;
const WIDE_CELL = "hidden px-4 py-3 text-right tabular-nums lg:table-cell";

/** The three figures, the note under them and the missing-price warning. */
export function PortfolioSummary({
  portfolio,
  note,
  income,
}: {
  portfolio: Portfolio;
  note: string;
  income?: Income | null;
}) {
  const withDividends = income ? portfolio.result + income.total : null;
  return (
    <section aria-label="Resumo da carteira" className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted">Valor hoje</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{formatMoney(portfolio.value)}</p>
          <p className="mt-1 text-sm text-text-soft">
            Quanto a carteira valeria pelos preços mais recentes.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted">
            <Term name="resultado">Resultado</Term>
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{formatSignedMoney(portfolio.result)}</p>
          <p className="tabular-nums text-sm text-text-soft">
            {formatSignedPercent(portfolio.resultShare)} sobre o total comprado
          </p>
          <p className="mt-1 text-sm text-text-soft">{resultPhrase(portfolio.result)}</p>
          {withDividends !== null && (
            <p className="mt-2 border-t border-border pt-2 tabular-nums text-sm">
              Com os <Term name="proventos">proventos</Term>: {formatSignedMoney(withDividends)}
              {portfolio.bought > 0 && (
                <span className="text-text-soft">
                  {" "}
                  ({formatSignedPercent(withDividends / portfolio.bought)})
                </span>
              )}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted">Quanto está investido</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{formatMoney(portfolio.invested)}</p>
          <p className="mt-1 text-sm text-text-soft">
            Quanto foi pago pelo que continua na carteira.
          </p>
        </div>
      </div>
      <p className="text-xs text-muted">{note}</p>
      {portfolio.missingPrices.length > 0 && (
        <p className="text-sm text-text-soft">
          ! O valor de hoje deixa de fora: {portfolio.missingPrices.join(", ")}. Estes ativos estão
          sem preço disponível.
        </p>
      )}
    </section>
  );
}

export function AllocationList({ portfolio }: { portfolio: Portfolio }) {
  return (
    <section aria-labelledby="alocacao" className="space-y-3">
      <h2 id="alocacao" className="text-2xl">
        Onde o dinheiro está (<Term name="alocacao">alocação</Term>)
      </h2>
      <ul className="space-y-3 rounded-lg border border-border bg-surface p-4">
        {portfolio.allocation.map((item) => (
          <li key={item.assetClass} className="grid gap-1 text-sm sm:grid-cols-[11rem_1fr_9rem] sm:items-center sm:gap-3">
            <span>{CLASS_LABELS[item.assetClass] ?? item.assetClass}</span>
            <span className="h-2 rounded-full bg-border">
              <span className="block h-2 rounded-full bg-accent" style={{ width: `${item.share * 100}%` }} />
            </span>
            <span className="tabular-nums text-text-soft sm:text-right">
              {formatPercent(item.share)} · {formatMoney(item.value)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Tesouro and fixed income pay no dividends; a missing payment list is said, never shown as zero.
function dividendCell(ticker: string, assetClass: string, income: Income | null): string {
  if (assetClass === "tesouro" || assetClass === "renda_fixa") return "—";
  const received = income?.received.get(ticker);
  return received ? formatMoney(received.total) : "não informado";
}

export function PositionsTable({
  portfolio,
  income,
}: {
  portfolio: Portfolio;
  income?: Income | null;
}) {
  const today = todayInBrazil();
  return (
    <section aria-labelledby="posicoes" className="space-y-3">
      <h2 id="posicoes" className="text-2xl">
        O que tem na carteira
      </h2>
      <p className="text-xs text-muted">
        O resultado de cada linha considera só o que continua na carteira. O total acima inclui
        também o que já foi vendido.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              <th scope="col" className="px-3 py-3 text-left font-medium sm:px-4">
                Ativo
              </th>
              <th scope="col" className={WIDE_HEADER_CELL}>
                Quantidade
              </th>
              <th scope="col" className={WIDE_HEADER_CELL}>
                <Term name="preco_medio">Preço médio</Term>
              </th>
              <th scope="col" className={WIDE_HEADER_CELL}>
                Preço hoje
              </th>
              <th scope="col" className={HEADER_CELL}>
                Valor
              </th>
              <th scope="col" className={HEADER_CELL}>
                Resultado
              </th>
              {income !== undefined && (
                <th scope="col" className={WIDE_HEADER_CELL}>
                  <Term name="proventos">Proventos</Term>
                </th>
              )}
              <th scope="col" className={WIDE_HEADER_CELL}>
                Parte da carteira
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {portfolio.positions.map((position) => {
              const fixed = position.assetClass === "renda_fixa";
              const note = fixed ? null : priceNote(position.priceDate, position.active);
              return (
                <tr key={position.ticker}>
                  <td className="px-3 py-3 sm:px-4">
                    {fixed ? (
                      <span className="font-medium">{position.name}</span>
                    ) : (
                      <Link
                        href={`/dados/${encodeURIComponent(position.ticker)}`}
                        className="font-medium text-accent underline-offset-2 hover:underline"
                      >
                        {position.name}
                      </Link>
                    )}
                    <span className="block text-xs text-muted">
                      {CLASS_LABELS[position.assetClass] ?? position.assetClass}
                      {position.assetClass !== "tesouro" && !fixed && (
                        <span className="tabular-nums"> · {position.ticker}</span>
                      )}
                    </span>
                    {note && <span className="block text-xs text-text-soft">{note}</span>}
                    {position.maturity && position.maturity < today && (
                      <span className="block text-xs text-text-soft">
                        Venceu em {formatDate(position.maturity)}. O valor parou de render nesse dia.
                      </span>
                    )}
                    {paysCoupons(position.ticker) && (
                      <span className="block text-xs text-text-soft">
                        Os juros pagos a cada seis meses não entram no resultado.
                      </span>
                    )}
                    {position.price === null && (
                      <span className="block text-xs text-text-soft">! Sem preço disponível.</span>
                    )}
                  </td>
                  <td className={WIDE_CELL}>{formatQuantity(position.quantity)}</td>
                  <td className={WIDE_CELL}>{formatMoney(position.averageCost)}</td>
                  <td className={WIDE_CELL}>{formatMoney(position.price)}</td>
                  <td className="px-2 py-3 text-right tabular-nums sm:px-4">{formatMoney(position.value)}</td>
                  <td className="px-2 py-3 text-right tabular-nums sm:px-4">
                    {formatSignedMoney(position.result)}
                  </td>
                  {income !== undefined && (
                    <td className={WIDE_CELL}>{dividendCell(position.ticker, position.assetClass, income)}</td>
                  )}
                  <td className={WIDE_CELL}>{formatPercent(position.share)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const DIVIDENDS_SINCE = "2016-11-01"; // first payment saved in the database

function gap(wallet: number, index: number | null, name: string): string {
  if (index === null) return `Comparação com o ${name}: não informado.`;
  const difference = wallet - index;
  if (Math.abs(difference) < 0.005 * index) return `Ficou praticamente igual ao ${name}.`;
  return `Ficou ${formatMoney(Math.abs(difference))} ${difference > 0 ? "acima" : "abaixo"} do ${name}.`;
}

/** Dividends received and what the same money would be in the CDI and corrected by the IPCA. */
export function IncomeSection({
  income,
  hasFixedIncome = false,
}: {
  income: Income | null;
  hasFixedIncome?: boolean;
}) {
  return (
    <section aria-labelledby="proventos" className="space-y-3">
      <h2 id="proventos" className="text-2xl">
        Proventos e comparação
      </h2>
      {income === null ? (
        <p className="text-sm text-text-soft">
          Proventos e comparação: não informado. Os dados não puderam ser lidos agora, ou nenhum
          ativo lançado tem preço.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted">
                <Term name="proventos">Proventos</Term> recebidos
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{formatMoney(income.total)}</p>
              <p className="tabular-nums text-sm text-text-soft">
                {formatMoney(income.lastYear)} nos últimos 12 meses
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted">
                Mesmo dinheiro no <Term name="cdi">CDI</Term>
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {income.cdi === null ? "não informado" : formatMoney(income.cdi)}
              </p>
              <p className="text-sm text-text-soft">
                Se cada compra tivesse ido para o CDI no mesmo dia, e cada venda saído de lá.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted">
                Mesmo dinheiro corrigido pelo <Term name="ipca">IPCA</Term>
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {income.ipca === null ? "não informado" : formatMoney(income.ipca)}
              </p>
              <p className="text-sm text-text-soft">
                Quanto seria preciso hoje para comprar o mesmo que o dinheiro comprava antes.
              </p>
            </div>
          </div>
          <p className="text-sm">
            Sua carteira hoje, somando os proventos:{" "}
            <strong className="tabular-nums font-semibold">{formatMoney(income.wallet)}</strong>.{" "}
            {gap(income.wallet, income.cdi, "CDI")} {gap(income.wallet, income.ipca, "IPCA")}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
            <li>
              Comparação calculada pelo site, desde a primeira compra, em {formatDate(income.since)}.
              Mostra o caminho até aqui, não o que vai acontecer.
            </li>
            <li>
              Cada provento conta pela <Term name="data_com">data-com</Term>: o dinheiro pode cair
              semanas depois. Os proventos entram sem render juros, o que deixa a carteira um pouco
              abaixo do que seria se tivessem sido reinvestidos. No{" "}
              <Term name="jcp">JCP</Term>, o valor pode estar antes do imposto retido na fonte.
            </li>
            {income.since < DIVIDENDS_SINCE && (
              <li>O site só tem proventos a partir de novembro de 2016. Os anteriores não entram.</li>
            )}
            {hasFixedIncome && (
              <li>A renda fixa lançada fica de fora da comparação, porque já rende uma parte do CDI.</li>
            )}
            <li>
              Proventos: Yahoo Finance. CDI e IPCA: Banco Central
              {income.cdiUntil && `, CDI até ${formatDate(income.cdiUntil)}`}
              {income.ipcaUntil && `, IPCA até ${formatMonthYear(income.ipcaUntil)}`}.
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
