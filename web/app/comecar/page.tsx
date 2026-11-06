import Link from "next/link";
import { doneSteps, STEPS, type StepId } from "@/lib/steps";
import { getCurrentUser } from "@/lib/supabase/server";
import { getFixedIncome, getProfile, getTransactions } from "@/lib/wallet";

// With a session the steps are marked from the person's records, so it cannot be prerendered.
export const instant = false;

export const metadata = { title: "Por onde começar | Site Investimentos" };

// Any failure means "nothing marked", never an error: the path is useful without the marks.
async function marks(): Promise<Set<StepId> | null> {
  try {
    if (!(await getCurrentUser())) return null;
    const [profile, transactions, fixedIncome] = await Promise.all([
      getProfile(),
      getTransactions(),
      getFixedIncome(),
    ]);
    return doneSteps({
      hasProfile: profile !== null,
      dailyLiquidity: fixedIncome.some((item) => item.daily_liquidity),
      purchaseDates: transactions.filter((t) => t.type === "buy").map((t) => t.date),
    });
  } catch {
    return null;
  }
}

export default async function StartPage() {
  const done = await marks();
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-8">
      <header className="space-y-2">
        <h1>Por onde começar</h1>
        <p className="max-w-2xl text-text-soft">
          As seis etapas da planta da página inicial, em ordem, cada uma com a ferramenta do site
          que ajuda nela. A ordem é uma sugestão de estudo, não de investimento.
        </p>
        <p className="text-sm text-text-soft">
          {done ? (
            <>
              {done.size} de {STEPS.length} etapas marcadas. O site marca sozinho o que dá para ver
              nos seus lançamentos. As outras ficam sem marca.
            </>
          ) : (
            <>
              <Link href="/entrar" className="text-accent underline underline-offset-2">
                Entre na sua conta
              </Link>{" "}
              para o site marcar as etapas que seus lançamentos já mostram.
            </>
          )}
        </p>
      </header>

      <ol className="space-y-4">
        {STEPS.map((step, index) => {
          const marked = done?.has(step.id) ?? false;
          return (
            <li
              key={step.id}
              aria-label={`${index + 1}. ${step.stage}${marked ? ", feita" : ""}`}
              className="rounded-lg border border-border bg-surface p-4 sm:p-5"
            >
              <p className="flex items-center gap-2 text-xs text-muted">
                <span className="tabular-nums">{index + 1}</span> · {step.stage}
                {marked && (
                  <span className="rounded-full bg-lime px-2 py-0.5 font-medium text-forest">
                    Feita
                  </span>
                )}
              </p>
              <h2 className="mt-1 text-xl">{step.title}</h2>
              <p className="mt-1 text-text-soft">{step.why}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {step.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              {done && step.doneWhen && !marked && (
                <p className="mt-2 text-xs text-muted">{step.doneWhen}</p>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
