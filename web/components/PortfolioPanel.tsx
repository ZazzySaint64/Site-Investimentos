import Link from "next/link";
import { Term } from "@/components/Term";
import type { Portfolio } from "@/lib/portfolio";
import {
  CLASS_LABELS,
  formatDate,
  formatMoney,
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
const WIDE_CELL = "hidden px-4 py-3 text-right font-mono lg:table-cell";

/** The three figures, the note under them and the missing-price warning. */
export function PortfolioSummary({ portfolio, note }: { portfolio: Portfolio; note: string }) {
  return (
    <section aria-label="Resumo da carteira" className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted">Valor hoje</p>
          <p className="mt-1 font-mono text-2xl">{formatMoney(portfolio.value)}</p>
          <p className="mt-1 text-sm text-text-soft">
            Quanto a carteira valeria pelos preços mais recentes.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted">
            <Term name="resultado">Resultado</Term>
          </p>
          <p className="mt-1 font-mono text-2xl">{formatSignedMoney(portfolio.result)}</p>
          <p className="font-mono text-sm text-text-soft">
            {formatSignedPercent(portfolio.resultShare)} sobre o total comprado
          </p>
          <p className="mt-1 text-sm text-text-soft">{resultPhrase(portfolio.result)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted">Quanto está investido</p>
          <p className="mt-1 font-mono text-2xl">{formatMoney(portfolio.invested)}</p>
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
      <h2 id="alocacao" className="text-sm font-medium text-muted">
        Onde o dinheiro está (<Term name="alocacao">alocação</Term>)
      </h2>
      <ul className="space-y-3 rounded-lg border border-border bg-surface p-4">
        {portfolio.allocation.map((item) => (
          <li key={item.assetClass} className="grid gap-1 text-sm sm:grid-cols-[11rem_1fr_9rem] sm:items-center sm:gap-3">
            <span>{CLASS_LABELS[item.assetClass] ?? item.assetClass}</span>
            <span className="h-2 rounded-full bg-border">
              <span className="block h-2 rounded-full bg-accent" style={{ width: `${item.share * 100}%` }} />
            </span>
            <span className="font-mono text-text-soft sm:text-right">
              {formatPercent(item.share)} · {formatMoney(item.value)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PositionsTable({ portfolio }: { portfolio: Portfolio }) {
  const today = todayInBrazil();
  return (
    <section aria-labelledby="posicoes" className="space-y-3">
      <h2 id="posicoes" className="text-sm font-medium text-muted">
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
                        <span className="font-mono"> · {position.ticker}</span>
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
                  <td className="px-2 py-3 text-right font-mono sm:px-4">{formatMoney(position.value)}</td>
                  <td className="px-2 py-3 text-right font-mono sm:px-4">
                    {formatSignedMoney(position.result)}
                  </td>
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
