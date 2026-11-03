"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime, isStale } from "@/lib/phrases";

const noSubscription = () => () => {};

/** Runs in the browser because the page can be cached and the warning depends on the current time. */
export function StaleBanner({ finishedAt }: { finishedAt: string | null }) {
  const stale = useSyncExternalStore(
    noSubscription,
    () => (finishedAt ? isStale(finishedAt, Date.now()) : false),
    () => false,
  );

  if (!stale || !finishedAt) return null;
  return (
    <p role="status" className="border-b border-border bg-surface px-4 py-2 text-center text-sm">
      ! Os dados podem estar desatualizados. Última atualização em {formatDateTime(finishedAt)}.
    </p>
  );
}
