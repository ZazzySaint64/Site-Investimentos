import { useId } from "react";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

/**
 * A word that opens its explanation by mouse, keyboard or touch. Uses the native popover.
 * Only spans inside, because a term can sit in the middle of a paragraph.
 */
export function Term({ name, children }: { name: GlossaryKey; children: React.ReactNode }) {
  const id = useId();
  const { title, text } = GLOSSARY[name];
  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        aria-label={`O que é ${title}?`}
        className="cursor-help underline decoration-muted decoration-dotted underline-offset-4 hover:text-accent"
      >
        {children}
      </button>
      <span
        id={id}
        popover="auto"
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border border-border bg-surface p-5 text-left font-sans text-text backdrop:bg-black/60"
      >
        <span className="block text-base font-semibold">{title}</span>
        <span className="mt-2 block text-sm font-normal leading-relaxed text-text-soft">{text}</span>
        <button
          type="button"
          popoverTarget={id}
          popoverTargetAction="hide"
          className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm"
        >
          Entendi
        </button>
      </span>
    </>
  );
}
