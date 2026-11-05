import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DataDate } from "@/components/DataFreshness";
import { AllocationList, PROFILE_LABELS, PortfolioSummary, PositionsTable } from "@/components/PortfolioPanel";
import { Term } from "@/components/Term";
import { getDemoPersonas, getDemoTransactions } from "@/lib/data";
import { computePortfolio, hasLaterSplit } from "@/lib/portfolio";
import { formatDate, formatMoney, formatQuantity } from "@/lib/phrases";

// Each persona reads the database on request, so this page cannot be prerendered.
export const instant = false;

export const metadata = { title: "Carteira de exemplo | Site Investimentos" };

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
    <main className="mx-auto max-w-6xl space-y-8 px-4 sm:px-8 py-8">
      <p className="rounded-lg border border-accent/60 px-4 py-3 text-sm">
        <strong className="font-semibold text-accent">Exemplo com carteira fictícia</strong>
        <span className="block text-text-soft sm:ml-2 sm:inline">
          Os nomes e as compras são inventados. Os preços são reais.
        </span>
      </p>

      <header className="space-y-3">
        <h1>
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

      <PortfolioSummary portfolio={portfolio} note="Proventos não entram nesta conta." />
      <AllocationList portfolio={portfolio} />
      <PositionsTable portfolio={portfolio} />

      <details className="rounded-lg border border-border bg-surface p-4 text-sm">
        <summary className="cursor-pointer text-text-soft">Ver compras e vendas</summary>
        <p className="mt-3 text-xs text-muted">Quantidade e preço como eram na data da operação.</p>
        <ul className="mt-2 divide-y divide-border">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="py-2">
              <span className="tabular-nums text-text-soft">{formatDate(transaction.date)}</span>
              {" · "}
              {transaction.type === "buy" ? "Compra" : "Venda"} de{" "}
              <span className="tabular-nums">{formatQuantity(transaction.quantity)}</span>{" "}
              {transaction.asset.name} a{" "}
              <span className="tabular-nums">{formatMoney(transaction.price)}</span>
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
