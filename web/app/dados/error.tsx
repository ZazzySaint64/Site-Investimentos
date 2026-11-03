"use client";

export default function DataError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl space-y-3 px-4 py-16">
      <h1 className="text-xl font-semibold">Não foi possível carregar os dados</h1>
      <p className="text-sm text-text-soft">O banco de dados não respondeu. Tente de novo.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
      >
        Tentar de novo
      </button>
    </main>
  );
}
