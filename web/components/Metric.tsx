import { Term } from "@/components/Term";
import type { GlossaryKey } from "@/lib/glossary";

/** A number with its glossary term and a sentence that says what it means. */
export function Metric({
  term,
  label,
  value,
  phrase,
}: {
  term: GlossaryKey;
  label: string;
  value: string;
  phrase: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted">
        <Term name={term}>{label}</Term>
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-text-soft">{phrase}</p>
    </div>
  );
}
