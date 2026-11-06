import Link from "next/link";
import { Term } from "@/components/Term";
import { getCdiHistory, getIpcaHistory } from "@/lib/data";
import { accumulatedFromMonthly, annualizedFromDaily, formatDate } from "@/lib/phrases";
import { realCdiByYear, realRate } from "@/lib/planning";
import { ContributionPlanner, ReservePlanner } from "./Planners";

// The example rates come from the CDI and the IPCA saved in the database.
export const instant = false;

export const metadata = { title: "Primeiros passos | Site Investimentos" };

export default async function FirstStepsPage() {
  const [cdi, ipca] = await Promise.all([getCdiHistory(), getIpcaHistory()]);
  const lastCdi = cdi.at(-1);
  const cdiYear = lastCdi ? annualizedFromDaily(lastCdi.value) : 0;
  const years = realCdiByYear(cdi, ipca);
  // Today's rate may be a peak, so a long simulation starts from the average of the past years.
  const average = years.length
    ? years.reduce((total, item) => total * (1 + item.real), 1) ** (1 / years.length) - 1
    : realRate(cdiYear, accumulatedFromMonthly(ipca.slice(-12).map((point) => point.value)));
  // Rounded to a tenth of a point, so the example reads as an example and not as a quote.
  const real = Math.round(average * 1000) / 1000;
  const band = years.length
    ? {
        since: years[0].year,
        worst: years.reduce((a, b) => (b.real < a.real ? b : a)),
        best: years.reduce((a, b) => (b.real > a.real ? b : a)),
      }
    : null;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-8">
      <header className="space-y-2">
        <h1>Primeiros passos</h1>
        <p className="max-w-2xl text-text-soft">
          Antes de escolher um investimento, duas contas: quanto guardar para imprevistos e quanto
          um aporte por mês pode virar com o tempo. São exemplos, e não dizem o que comprar.
        </p>
        <p className="text-sm text-text-soft">
          Palavras que ajudam: <Term name="cdi">CDI</Term>, <Term name="ipca">IPCA</Term>,{" "}
          <Term name="liquidez_diaria">liquidez diária</Term> e <Term name="fgc">FGC</Term>.
        </p>
      </header>
      <ReservePlanner cdi={cdiYear} />
      <ContributionPlanner real={real} band={band} since={years[0]?.year ?? null} />
      <p className="text-sm text-text-soft">
        CDI e IPCA: Banco Central, séries 12 e 433 do SGS
        {lastCdi && `, até ${formatDate(lastCdi.date)}`}. Os números vêm da B3 e do IBGE.{" "}
        <Link href="/renda-fixa" className="text-accent underline underline-offset-2">
          Ver também as contas da renda fixa
        </Link>
        .
      </p>
    </main>
  );
}
