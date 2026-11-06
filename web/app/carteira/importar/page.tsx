import Link from "next/link";
import { getHoldableAssets } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import { getTransactions } from "@/lib/wallet";
import { ImportForm } from "./ImportForm";

// The page reads the session cookie, so it cannot be prerendered.
export const instant = false;

export const metadata = { title: "Importar da B3 | Site Investimentos" };

const LINK = "text-sm text-accent underline-offset-2 hover:underline";

export default async function ImportarPage() {
  await requireUser();
  const [assets, transactions] = await Promise.all([getHoldableAssets(), getTransactions()]);
  const existing = transactions.map((transaction) => ({
    ticker: transaction.asset.ticker,
    type: transaction.type,
    quantity: transaction.quantity,
    price: transaction.price,
    date: transaction.date,
  }));
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1>Importar da B3</h1>
        <p className="text-text-soft">
          Em vez de digitar cada compra, envie o extrato de negociação que a B3 dá a todo
          investidor.
        </p>
        <nav aria-label="Ações da carteira" className="flex gap-4">
          <Link href="/carteira" className={LINK}>
            Ver minha carteira
          </Link>
          <Link href="/carteira/lancar" className={LINK}>
            Lançar à mão
          </Link>
        </nav>
      </header>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-text-soft">
        <li>
          Entre na{" "}
          <a
            href="https://www.investidor.b3.com.br/"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-2"
          >
            Área do Investidor da B3
          </a>{" "}
          com sua conta gov.br ou da B3.
        </li>
        <li>Abra os extratos, escolha negociação e o período desde a primeira compra.</li>
        <li>Baixe o arquivo em Excel (.xlsx) e escolha ele abaixo.</li>
      </ol>
      <p className="rounded-lg border border-border bg-surface p-3 text-sm">
        O arquivo é lido no seu navegador e não é enviado. Só as operações que você confirmar são
        salvas na sua carteira.
      </p>
      <ImportForm
        holdable={assets.map((asset) => [asset.ticker, asset.name])}
        existing={existing}
      />
    </main>
  );
}
