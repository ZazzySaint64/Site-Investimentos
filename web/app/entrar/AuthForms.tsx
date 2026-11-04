"use client";

import { useActionState } from "react";
import {
  deleteAccount,
  requestPasswordReset,
  setNewPassword,
  signInWithPassword,
  signUp,
} from "./actions";

type State = { message: string } | null;
type FormAction = (state: State, formData: FormData) => Promise<State>;

const INPUT = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";
const BUTTON = "rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg";

function Field({
  label,
  name,
  type,
  autoComplete,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  minLength?: number;
  hint?: string;
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
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} aria-label={label} className="space-y-3">
      {children}
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
    <Form action={signInWithPassword} label="Entrar" submit="Entrar">
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
      <Field label="Senha" name="password" type="password" autoComplete="current-password" />
    </Form>
  );
}

export function SignUpForm() {
  return (
    <Form action={signUp} label="Criar conta" submit="Criar conta">
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="Mínimo de 8 caracteres."
      />
    </Form>
  );
}

export function ResetRequestForm() {
  return (
    <Form action={requestPasswordReset} label="Esqueci a senha" submit="Enviar link">
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
    </Form>
  );
}

export function NewPasswordForm() {
  return (
    <Form action={setNewPassword} label="Nova senha" submit="Salvar nova senha">
      <Field
        label="Nova senha"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="Mínimo de 8 caracteres."
      />
    </Form>
  );
}

export function DeleteAccountForm() {
  return (
    <Form action={deleteAccount} label="Apagar minha conta" submit="Apagar minha conta">
      <Field label="Digite APAGAR para confirmar" name="confirm" type="text" />
    </Form>
  );
}
