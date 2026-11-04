"use client";

import { useActionState } from "react";
import type { FormState } from "./actions";

/** `action` is a Server Action already bound to the row id. */
export function DeleteButton({ action }: { action: () => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="mt-1">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border px-2 py-1 text-xs text-text-soft disabled:opacity-60"
      >
        Apagar
      </button>
      {state && (
        <p role="alert" className="mt-1 text-sm text-text-soft">
          {state.message}
        </p>
      )}
    </form>
  );
}
