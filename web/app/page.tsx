import Link from "next/link";
import { getAssets, getRuns } from "@/lib/data";
import { formatDateTime } from "@/lib/phrases";

const STEPS = [
  {
    title: "Escolha um ativo",
    text: "Ações, fundos imobiliários e títulos do Tesouro Direto, com busca por nome.",
  },
  {
    title: "Leia em palavras simples",
    text: "Cada número vem com uma frase dizendo o que ele significa.",
  },
  {
    title: "Tire a dúvida na hora",
    text: "Toque em uma palavra sublinhada para ver a explicação.",
  },
];

const READY = [
  "Carteira de exemplo, sem precisar criar conta",
  "Preços, juros e inflação atualizados toda noite",
  "Estatísticas de cada ativo com explicação",
  "Comparação de cada ativo com o CDI",
  "Glossário dos termos usados",
];

const COMING = [
  "Sua própria carteira, com login",
  "Simulações do futuro, sempre como faixa de possibilidades",
  "Assistente de IA que só afirma o que os dados mostram",
];

export default async function Home() {
  const [assets, runs] = await Promise.all([getAssets(), getRuns()]);
  const lastFinished = runs.find((run) => run.finished_at);

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      <section className="max-w-3xl space-y-5">
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          Entenda investimentos sem precisar ser especialista
        </h1>
        <p className="text-lg leading-relaxed text-text-soft">
          Veja como cada investimento se comportou e o que os números querem dizer. Tudo vem de
          dados públicos, explicado em palavras simples.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/demo/ana"
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg hover:opacity-90"
          >
            Ver carteira de exemplo
          </Link>
          <Link
            href="/dados"
            className="rounded-md border border-border px-4 py-2.5 text-sm hover:text-accent"
          >
            Explorar ativos
          </Link>
        </div>
        <p className="text-sm text-muted">
          {assets.length} ativos acompanhados.
          {lastFinished?.finished_at &&
            ` Dados atualizados em ${formatDateTime(lastFinished.finished_at)}.`}
        </p>
      </section>

      <section aria-labelledby="como" className="space-y-4">
        <h2 id="como" className="text-xl font-semibold">
          Como usar
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-border bg-surface p-5">
              <p className="font-mono text-sm text-accent">{index + 1}</p>
              <p className="mt-2 font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-text-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="andamento" className="grid gap-3 sm:grid-cols-2">
        <h2 id="andamento" className="text-xl font-semibold sm:col-span-2">
          O que já funciona
        </h2>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="font-medium">Pronto para usar</p>
          <ul className="mt-3 space-y-2 text-sm text-text-soft">
            {READY.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="font-medium">Em construção</p>
          <ul className="mt-3 space-y-2 text-sm text-text-soft">
            {COMING.map((item) => (
              <li key={item}>… {item}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
