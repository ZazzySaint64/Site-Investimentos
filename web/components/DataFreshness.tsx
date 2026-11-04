import { connection } from "next/server";
import { Suspense } from "react";
import { getLastGoodUpdate } from "@/lib/data";
import { formatDateTime, isStale } from "@/lib/phrases";

// Both read the database on every visit, inside Suspense, so cached pages never show an old date.

/** undefined means that the date could not be read. */
async function readUpdate(): Promise<string | null | undefined> {
  try {
    return await getLastGoodUpdate();
  } catch {
    return undefined;
  }
}

async function BannerContent() {
  await connection();
  const finishedAt = await readUpdate();
  if (!finishedAt || !isStale(finishedAt)) return null;
  return (
    <p role="status" className="border-b border-border bg-surface px-4 py-2 text-center text-sm">
      ! Os dados podem estar desatualizados. Última atualização em {formatDateTime(finishedAt)}.
    </p>
  );
}

async function DateContent() {
  const finishedAt = await readUpdate();
  if (finishedAt === undefined) return null;
  return (
    <p className="text-xs text-muted">
      {finishedAt
        ? `Dados atualizados em ${formatDateTime(finishedAt)}.`
        : "Os dados ainda não foram atualizados."}
    </p>
  );
}

export function StaleBanner() {
  return (
    <Suspense fallback={null}>
      <BannerContent />
    </Suspense>
  );
}

export function DataDate() {
  return (
    <Suspense fallback={null}>
      <DateContent />
    </Suspense>
  );
}
