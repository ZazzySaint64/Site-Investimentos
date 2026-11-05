"use client";

import { useState } from "react";

export type Specimen = { key: string; label: string; sheet: React.ReactNode };

/** The home page's live part: pick an investment and read its sheet. Without script, the first one shows. */
export function SpecimenPicker({ specimens }: { specimens: Specimen[] }) {
  const [selected, setSelected] = useState(specimens[0]?.key);
  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div
        role="group"
        aria-label="Escolha um investimento"
        className="flex snap-x gap-5 overflow-x-auto lg:col-span-5 lg:flex-col lg:gap-2 lg:overflow-visible"
      >
        {specimens.map((specimen) => {
          const active = specimen.key === selected;
          return (
            <button
              key={specimen.key}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(specimen.key)}
              className={`font-display shrink-0 snap-start text-left text-[22px] leading-[1.1] hover:text-accent lg:text-[clamp(2.25rem,1.3rem+3.2vw,4rem)] ${
                active ? "text-text" : "text-muted"
              }`}
            >
              {specimen.label}
            </button>
          );
        })}
      </div>
      <div className="min-w-0 rounded-lg bg-mist p-3 sm:p-6 lg:col-span-7 lg:p-10">
        {specimens.map((specimen) => (
          <div key={specimen.key} hidden={specimen.key !== selected}>
            {specimen.sheet}
          </div>
        ))}
      </div>
    </div>
  );
}
