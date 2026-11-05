"use client";

import { useActionState } from "react";
import {
  deleteAccount,
  requestPasswordReset,
  setNewPassword,
  signOut,
  signInWithPassword,
  signUp,
} from "./actions";

type State = { message: string; email?: string } | null;
type FormAction = (state: State, formData: FormData) => Promise<State>;

const INPUT = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";
const BUTTON = "rounded-full bg-accent px-3 py-2 text-sm font-medium text-bg";

function Field({
  label,
  name,
  type,
  autoComplete,
  minLength,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  minLength?: number;
  hint?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-text-soft">{label}</span>
      <input
        name={name}
        type={type}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className={INPUT}
      />
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Form({
  action,
  label,
  submit,
  children,
}: {
  action: FormAction;
  label: string;
  submit: string;
  children: (email: string | undefined) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} aria-label={label} className="space-y-3">
      {children(state?.email)}
      <button type="submit" disabled={pending} className={`${BUTTON} disabled:opacity-60`}>
        {submit}
      </button>
      <p role="status" className="text-sm text-text-soft">
        {state?.message}
      </p>
    </form>
  );
}

export function SignInForm() {
  return (
    <Form action={signInAndReload} label="Entrar" submit="Entrar">
      {(email) => (
        <>
          <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={email} />
          <Field label="Senha" name="password" type="password" autoComplete="current-password" />
        </>
      )}
    </Form>
  );
}

export function SignUpForm() {
  return (
    <Form action={signUp} label="Criar conta" submit="Criar conta">
      {(email) => (
        <>
          <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={email} />
          <Field
            label="Senha"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            hint="Mínimo de 8 caracteres."
          />
        </>
      )}
    </Form>
  );
}

export function ResetRequestForm() {
  return (
    <Form action={requestPasswordReset} label="Esqueci a senha" submit="Enviar link">
      {(email) => (
        <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={email} />
      )}
    </Form>
  );
}

export function NewPasswordForm() {
  return (
    <Form action={setNewPassword} label="Nova senha" submit="Salvar nova senha">
      {() => (
        <Field
          label="Nova senha"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          hint="Mínimo de 8 caracteres."
        />
      )}
    </Form>
  );
}

// Full page loads, not soft navigation: it drops everything the previous user left in memory.
async function signInAndReload(state: State, formData: FormData): Promise<State> {
  const result = await signInWithPassword(state, formData);
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload on purpose
  if (!result) window.location.assign("/carteira");
  return result;
}

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
  return (
    <Form action={deleteAndLeave} label="Apagar minha conta" submit="Apagar minha conta">
      {() => <Field label="Digite APAGAR para confirmar" name="confirm" type="text" />}
    </Form>
  );
}
