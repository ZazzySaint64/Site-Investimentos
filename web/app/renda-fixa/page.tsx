import { Term } from "@/components/Term";
import { getMacroSummary } from "@/lib/data";
import { annualizedFromDaily } from "@/lib/phrases";
import { ExemptCalculator, RateShockCalculator } from "./Calculators";

// The rate example comes from today's Selic in the database.
export const instant = false;

export const metadata = { title: "Contas da renda fixa | Site Investimentos" };

const DEFAULT_YEARS = 10;

type Props = { searchParams: Promise<{ anos?: string }> };

export default async function FixedIncomePage({ searchParams }: Props) {
  const [{ anos }, macro] = await Promise.all([searchParams, getMacroSummary()]);
  const asked = Number(anos);
  const years =
    Number.isFinite(asked) && asked >= 0.5 && asked <= 30
      ? Math.round(asked * 2) / 2
      : DEFAULT_YEARS;
  // Rounded to a quarter point, so the example reads as an example and not as a quote.
  const selic = macro.selic ? Math.round(annualizedFromDaily(macro.selic.value) * 400) / 400 : 0.13;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-8">
      <header className="space-y-2">
        <h1>Contas da renda fixa</h1>
        <p className="max-w-2xl text-text-soft">
          Duas contas que mudam a leitura de um título: o efeito do imposto e o efeito dos juros
          sobre o preço. São exemplos, e não dizem o que comprar.
        </p>
        <p className="text-sm text-text-soft">
          Palavras que ajudam: <Term name="tabela_regressiva">tabela regressiva</Term>,{" "}
          <Term name="lci_lca">LCI e LCA</Term>, <Term name="fgc">FGC</Term>,{" "}
          <Term name="marcacao_mercado">marcação a mercado</Term> e{" "}
          <Term name="duration">duration</Term>.
        </p>
      </header>
      <ExemptCalculator />
      <RateShockCalculator years={years} rate={selic} />
    </main>
  );
}
