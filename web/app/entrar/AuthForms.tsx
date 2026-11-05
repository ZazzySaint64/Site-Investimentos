"use client";

import { useActionState } from "react";
import { deleteAccount, signOut } from "./actions";

type State = { message: string } | null;

const BUTTON = "rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg";

async function deleteAndLeave(state: State, formData: FormData): Promise<State> {
  const result = await deleteAccount(state, formData);
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload on purpose
  if (!result) window.location.assign("/entrar?aviso=conta-apagada");
  return result;
}

export function SignOutForm() {
  async function leave() {
    await signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload on purpose
    window.location.assign("/");
  }
  return (
    <form action={leave}>
      <button type="submit" className={BUTTON}>
        Sair
      </button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteAndLeave, null);
  return (
    <form action={formAction} aria-label="Apagar minha conta" className="space-y-3">
      <label className="block space-y-1 text-sm">
        <span className="text-text-soft">Digite APAGAR para confirmar</span>
        <input
          name="confirm"
          type="text"
          required
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>
      <button type="submit" disabled={pending} className={`${BUTTON} disabled:opacity-60`}>
        Apagar minha conta
      </button>
      <p role="status" className="text-sm text-text-soft">
        {state?.message}
      </p>
    </form>
  );
}
