import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DataDate } from "@/components/DataFreshness";
import { Term } from "@/components/Term";
import { getDemoPersonas, getDemoTransactions } from "@/lib/data";
import { computePortfolio, hasLaterSplit } from "@/lib/portfolio";
import {
  CLASS_LABELS,
  formatDate,
  formatMoney,
  formatPercent,
  formatQuantity,
  formatSignedMoney,
  formatSignedPercent,
  priceNote,
  resultPhrase,
} from "@/lib/phrases";

// Each persona reads the database on request, so this page cannot be prerendered.
export const instant = false;

export const metadata = { title: "Carteira de exemplo | Site Investimentos" };

const PROFILE_LABELS: Record<string, string> = {
  conservador: "Perfil conservador",
  moderado: "Perfil moderado",
  arrojado: "Perfil arrojado",
};
const HEADER_CELL = "px-2 py-3 text-right font-medium sm:px-4";
const WIDE_HEADER_CELL = `${HEADER_CELL} hidden lg:table-cell`;
const WIDE_CELL = "hidden px-4 py-3 text-right font-mono lg:table-cell";

type Props = { params: Promise<{ persona: string }> };

export default async function DemoPage({ params }: Props) {
  const slug = (await params).persona;
  await connection();
  const [personas, transactions] = await Promise.all([
    getDemoPersonas(),
    getDemoTransactions(slug),
  ]);
  const persona = personas.find((item) => item.slug === slug);
  if (!persona) notFound();

  const portfolio = computePortfolio(transactions);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <p className="rounded-lg border border-accent/60 px-4 py-3 text-sm">
        <strong className="font-semibold text-accent">Exemplo com carteira fictícia</strong>
        <span className="block text-text-soft sm:ml-2 sm:inline">
          Os nomes e as compras são inventados. Os preços são reais.
        </span>
      </p>

      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">
          <Term name="carteira">Carteira</Term> de {persona.name}
        </h1>
        <nav aria-label="Carteiras de exemplo" className="flex flex-wrap gap-2">
          {personas.map((item) => {
            const active = item.slug === persona.slug;
            return (
              <Link
                key={item.slug}
                href={`/demo/${item.slug}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  active ? "border-accent" : "border-border hover:border-muted"
                }`}
              >
                <span className={active ? "font-medium text-accent" : "font-medium"}>
                  {item.name}
                </span>
                <span className="block text-xs text-muted">{PROFILE_LABELS[item.risk_profile]}</span>
              </Link>
            );
          })}
        </nav>
        <p className="text-sm text-text-soft">{persona.description}</p>
        <DataDate />
      </header>

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
        <p className="text-xs text-muted">Proventos não entram nesta conta.</p>
        {portfolio.missingPrices.length > 0 && (
          <p className="text-sm text-text-soft">
            ! O valor de hoje deixa de fora: {portfolio.missingPrices.join(", ")}. Estes ativos
            estão sem preço disponível.
          </p>
        )}
      </section>

      <section aria-labelledby="alocacao" className="space-y-3">
        <h2 id="alocacao" className="text-sm font-medium text-muted">
          Onde o dinheiro está (<Term name="alocacao">alocação</Term>)
        </h2>
        <ul className="space-y-3 rounded-lg border border-border bg-surface p-4">
          {portfolio.allocation.map((item) => (
            <li key={item.assetClass} className="grid gap-1 text-sm sm:grid-cols-[11rem_1fr_9rem] sm:items-center sm:gap-3">
              <span>{CLASS_LABELS[item.assetClass] ?? item.assetClass}</span>
              <span className="h-2 rounded-full bg-border">
                <span
                  className="block h-2 rounded-full bg-accent"
                  style={{ width: `${item.share * 100}%` }}
                />
              </span>
              <span className="font-mono text-text-soft sm:text-right">
                {formatPercent(item.share)} · {formatMoney(item.value)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="posicoes" className="space-y-3">
        <h2 id="posicoes" className="text-sm font-medium text-muted">
          O que tem na carteira
        </h2>
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
              {portfolio.positions.map((position) => (
                <tr key={position.ticker}>
                  <td className="px-3 py-3 sm:px-4">
                    <Link
                      href={`/dados/${encodeURIComponent(position.ticker)}`}
                      className="font-medium text-accent underline-offset-2 hover:underline"
                    >
                      {position.name}
                    </Link>
                    <span className="block text-xs text-muted">
                      {CLASS_LABELS[position.assetClass] ?? position.assetClass}
                      {position.assetClass !== "tesouro" && (
                        <span className="font-mono"> · {position.ticker}</span>
                      )}
                    </span>
                    {priceNote(position.priceDate, position.active) && (
                      <span className="block text-xs text-text-soft">
                        {priceNote(position.priceDate, position.active)}
                      </span>
                    )}
                    {position.price === null && (
                      <span className="block text-xs text-text-soft">
                        ! Sem preço disponível.
                      </span>
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
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="rounded-lg border border-border bg-surface p-4 text-sm">
        <summary className="cursor-pointer text-text-soft">Ver compras e vendas</summary>
        <p className="mt-3 text-xs text-muted">Quantidade e preço como eram na data da operação.</p>
        <ul className="mt-2 divide-y divide-border">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="py-2">
              <span className="font-mono text-text-soft">{formatDate(transaction.date)}</span>
              {" · "}
              {transaction.type === "buy" ? "Compra" : "Venda"} de{" "}
              <span className="font-mono">{formatQuantity(transaction.quantity)}</span>{" "}
              {transaction.asset.name} a{" "}
              <span className="font-mono">{formatMoney(transaction.price)}</span>
              {hasLaterSplit(transaction) && (
                <span className="block text-xs text-muted">
                  Depois houve <Term name="desdobramento">desdobramento ou grupamento</Term>. Por
                  isso, a quantidade e o preço médio da tabela são outros.
                </span>
              )}
            </li>
          ))}
        </ul>
      </details>
    </main>
  );
}
