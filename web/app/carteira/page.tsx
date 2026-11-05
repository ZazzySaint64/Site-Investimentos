import Link from "next/link";
import { DataDate } from "@/components/DataFreshness";
import {
  AllocationList,
  PROFILE_LABELS,
  PortfolioSummary,
  PositionsTable,
} from "@/components/PortfolioPanel";
import { Term } from "@/components/Term";
import { getWallet } from "@/lib/wallet";

// The page reads the session cookie, so it cannot be prerendered.
export const instant = false;

export const metadata = { title: "Minha carteira | Site Investimentos" };

const LINK = "text-sm text-accent underline-offset-2 hover:underline";

export default async function CarteiraPage() {
  const { portfolio, transactions, fixedIncome, profile } = await getWallet();
  const empty = transactions.length === 0 && fixedIncome.length === 0;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 sm:px-8 py-8">
      <header className="space-y-3">
        <h1>Minha carteira</h1>
        <nav aria-label="Ações da carteira" className="flex gap-4">
          <Link href="/carteira/lancar" className={LINK}>
            Lançar
          </Link>
          <Link href="/conta" className={LINK}>
            Conta
          </Link>
        </nav>
        <DataDate />
      </header>

      <p className="text-sm text-text-soft">
        {profile ? (
          <>
            <Term name="perfil_risco">{PROFILE_LABELS[profile.risk_profile]}</Term>.{" "}
            <Link href="/questionario" className={LINK}>
              Rever meu perfil
            </Link>
          </>
        ) : (
          <>
            Responda ao questionário para definir seu perfil e sua meta.{" "}
            <Link href="/questionario" className={LINK}>
              Fazer o questionário
            </Link>
          </>
        )}
      </p>

      {empty ? (
        <section className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <p>Sua carteira está vazia.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/carteira/lancar" className={LINK}>
              Lançar a primeira compra
            </Link>
            <Link href="/demo/ana" className={LINK}>
              Ver carteira de exemplo
            </Link>
          </div>
        </section>
      ) : (
        <>
          <PortfolioSummary
            portfolio={portfolio}
            note="Proventos não entram nesta conta. Renda fixa aparece em valor bruto, sem imposto."
          />
          {portfolio.positions.length > 0 && (
            <>
              <AllocationList portfolio={portfolio} />
              <PositionsTable portfolio={portfolio} />
            </>
          )}
        </>
      )}
    </main>
  );
}
