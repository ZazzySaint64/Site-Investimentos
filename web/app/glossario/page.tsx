import { GLOSSARY } from "@/lib/glossary";

export const metadata = { title: "Glossário | Site Investimentos" };

export default function GlossaryPage() {
  const entries = Object.values(GLOSSARY).sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1>Glossário</h1>
        <p className="text-sm text-text-soft">Os termos usados no site, em palavras simples.</p>
      </header>
      <dl className="divide-y divide-border rounded-lg border border-border bg-surface">
        {entries.map((entry) => (
          <div key={entry.title} className="p-4">
            <dt className="font-medium">{entry.title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-text-soft">{entry.text}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
