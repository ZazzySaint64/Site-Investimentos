"use client";

import { useActionState, useId } from "react";
import { addTransactionAction } from "./actions";

const INPUT = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";

export function TransactionForm({
  assets,
  today,
}: {
  assets: { ticker: string; name: string }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(addTransactionAction, null);
  const v = state?.values ?? {};
  const typeId = useId();
  return (
    <form action={formAction} aria-label="Compra e venda" className="space-y-3">
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Ativo</span>
        <input name="ticker" list="holdable-assets" defaultValue={v.ticker} autoComplete="off" className={INPUT} />
      </label>
      <datalist id="holdable-assets">
        {assets.map((asset) => (
          <option key={asset.ticker} value={asset.ticker} label={asset.name} />
        ))}
      </datalist>
      <div className="space-y-1 text-sm">
        <label htmlFor={typeId} className="block text-text-soft">
          Operação
        </label>
        <select id={typeId} name="type" defaultValue={v.type ?? "buy"} className={INPUT}>
          <option value="buy">Compra</option>
          <option value="sell">Venda</option>
        </select>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Quantidade</span>
        <input name="quantity" type="number" step="any" min="0" defaultValue={v.quantity} className={INPUT} />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Preço por unidade</span>
        <input name="price" type="number" step="any" min="0" defaultValue={v.price} className={INPUT} />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Data</span>
        <input name="date" type="date" max={today} defaultValue={v.date} className={INPUT} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg disabled:opacity-60"
      >
        Salvar lançamento
      </button>
      {state && (
        <p role="alert" className="text-sm text-text-soft">
          {state.message}
        </p>
      )}
    </form>
  );
}
