import Link from "next/link";
import { DataDate } from "@/components/DataFreshness";
import { Term } from "@/components/Term";
import { getHoldableAssets } from "@/lib/data";
import { formatDate, formatMoney, formatQuantity, todayInBrazil } from "@/lib/phrases";
import { hasLaterSplit } from "@/lib/portfolio";
import { requireUser } from "@/lib/supabase/server";
import { getFixedIncome, getTransactions } from "@/lib/wallet";
import { deleteFixedIncomeAction, deleteTransactionAction } from "./actions";
import { DeleteButton } from "./DeleteButton";
import { FixedIncomeForm } from "./FixedIncomeForm";
import { TransactionForm } from "./TransactionForm";

// The page reads the session cookie, so it cannot be prerendered.
export const instant = false;

export const metadata = { title: "Lançar | Site Investimentos" };

export default async function LancarPage() {
  await requireUser();
  const [assets, transactions, fixedIncome] = await Promise.all([
    getHoldableAssets(),
    getTransactions(),
    getFixedIncome(),
  ]);
  const today = todayInBrazil();
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1>Lançar</h1>
        <p className="text-sm text-text-soft">
          A quantidade e o preço são os da data da operação. Desdobramentos posteriores são
          corrigidos automaticamente.
        </p>
        <nav aria-label="Ações da carteira" className="flex gap-4 text-sm">
          <Link href="/carteira" className="text-accent underline-offset-2 hover:underline">
            Ver minha carteira
          </Link>
          <Link href="/carteira/importar" className="text-accent underline-offset-2 hover:underline">
            Importar da B3
          </Link>
        </nav>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Compra e venda</h2>
        <TransactionForm assets={assets} today={today} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          <Term name="renda_fixa">Renda fixa</Term>
        </h2>
        <p className="text-xs text-muted">
          O rendimento segue o <Term name="cdi">CDI</Term>. Veja também{" "}
          <Term name="liquidez_diaria">liquidez diária</Term>.
        </p>
        <FixedIncomeForm today={today} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Seus lançamentos</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-text-soft">Nenhum lançamento ainda.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
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
                <DeleteButton
                  action={deleteTransactionAction.bind(null, transaction.id)}
                  description={`${transaction.type === "buy" ? "compra" : "venda"} de ${transaction.asset.name} em ${formatDate(transaction.date)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Suas rendas fixas</h2>
        {fixedIncome.length === 0 ? (
          <p className="text-sm text-text-soft">Nenhuma renda fixa ainda.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {fixedIncome.map((item) => (
              <li key={item.id} className="py-2">
                <span className="tabular-nums text-text-soft">{formatDate(item.start_date)}</span>
                {" · "}
                {item.name}: <span className="tabular-nums">{formatMoney(item.principal)}</span> a{" "}
                <span className="tabular-nums">{formatQuantity(item.cdi_pct)}%</span> do CDI
                {item.maturity && <>, vencimento em {formatDate(item.maturity)}</>}
                {item.daily_liquidity && <>, com liquidez diária</>}
                <DeleteButton
                  action={deleteFixedIncomeAction.bind(null, item.id)}
                  description={`renda fixa ${item.name} de ${formatDate(item.start_date)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <DataDate />
    </main>
  );
}
