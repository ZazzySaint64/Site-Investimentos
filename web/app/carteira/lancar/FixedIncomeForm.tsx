"use client";

import { useActionState, useId } from "react";
import { addFixedIncomeAction } from "./actions";

const INPUT = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";

export function FixedIncomeForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState(addFixedIncomeAction, null);
  const v = state?.values ?? {};
  const hintId = useId();
  return (
    <form action={formAction} aria-label="Renda fixa" className="space-y-3">
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Nome</span>
        <input name="name" type="text" defaultValue={v.name} className={INPUT} />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Valor aplicado</span>
        <input name="principal" type="number" step="any" min="0" defaultValue={v.principal} className={INPUT} />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Percentual do CDI</span>
        <input name="cdi_pct" type="number" step="any" min="0" defaultValue={v.cdi_pct} className={INPUT} />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Data de início</span>
        <input name="start_date" type="date" max={today} defaultValue={v.start_date} className={INPUT} />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Vencimento</span>
        <input name="maturity" type="date" defaultValue={v.maturity} aria-describedby={hintId} className={INPUT} />
      </label>
      <p id={hintId} className="-mt-2 text-xs text-muted">
        Opcional.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input name="daily_liquidity" type="checkbox" defaultChecked={v.daily_liquidity === "on"} />
        <span className="text-text-soft">Liquidez diária</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-3 py-2 text-sm font-medium text-bg disabled:opacity-60"
      >
        Salvar renda fixa
      </button>
      {state && (
        <p role="alert" className="text-sm text-text-soft">
          {state.message}
        </p>
      )}
    </form>
  );
}
