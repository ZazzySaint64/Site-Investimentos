"use client";

import { useActionState, useState } from "react";
import { Term } from "@/components/Term";
import {
  QUESTIONS,
  TARGETS,
  TARGET_CLASSES,
  isValidTarget,
  riskProfileFromAnswers,
  type RiskProfile,
  type TargetClass,
} from "@/lib/profile";
import type { Profile } from "@/lib/wallet";
import { saveProfileAction } from "./actions";

const PROFILE_LABEL: Record<RiskProfile, string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arrojado: "Arrojado",
};

const CLASS_LABEL: Record<TargetClass, React.ReactNode> = {
  renda_fixa: <Term name="renda_fixa">Renda fixa</Term>,
  acao_br: (
    <>
      <Term name="acao">Ações</Term> do Brasil
    </>
  ),
  fii: <Term name="fii">Fundos imobiliários</Term>,
  acao_eua: "Ações dos EUA",
  cripto: "Cripto",
};

// Plain-text names for aria-label, so the number inputs have a stable accessible name.
const CLASS_NAME: Record<TargetClass, string> = {
  renda_fixa: "Renda fixa",
  acao_br: "Ações do Brasil",
  fii: "Fundos imobiliários",
  acao_eua: "Ações dos EUA",
  cripto: "Cripto",
};

type Values = Record<TargetClass, string>;

const toValues = (target: Record<TargetClass, number>): Values =>
  Object.fromEntries(TARGET_CLASSES.map((name) => [name, String(target[name])])) as Values;

export function QuestionnaireForm({ saved }: { saved: Profile | null }) {
  const [answers, setAnswers] = useState<(number | null)[]>(QUESTIONS.map(() => null));
  const [risk, setRisk] = useState<RiskProfile | null>(saved?.risk_profile ?? null);
  const [values, setValues] = useState<Values | null>(saved ? toValues(saved.target_allocation) : null);
  const [state, formAction, pending] = useActionState(saveProfileAction, null);

  function answer(question: number, option: number) {
    const next = answers.map((a, i) => (i === question ? option : a));
    setAnswers(next);
    if (next.every((a) => a !== null)) {
      const profile = riskProfileFromAnswers(next as number[]);
      setRisk(profile);
      setValues(toValues(TARGETS[profile]));
    }
  }

  const numbers = values && Object.fromEntries(TARGET_CLASSES.map((name) => [name, Number(values[name])]));
  const sum = numbers ? Object.values(numbers).reduce((a, b) => a + b, 0) : 0;
  const canSave = risk !== null && isValidTarget(numbers);

  return (
    <form action={formAction} aria-label="Questionário de perfil" className="space-y-6">
      {QUESTIONS.map((question, q) => (
        <fieldset key={question.text} className="space-y-2">
          <legend className="text-base font-medium">{question.text}</legend>
          {question.options.map((option, o) => (
            <label key={option} className="flex items-start gap-2 text-sm text-text-soft">
              <input
                type="radio"
                name={`pergunta-${q}`}
                checked={answers[q] === o}
                onChange={() => answer(q, o)}
                className="mt-0.5"
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <p className="text-sm text-muted">Este questionário é simplificado e não substitui avaliação profissional.</p>

      {risk && values && (
        <section className="space-y-4 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold">Seu perfil: {PROFILE_LABEL[risk]}</h2>
          <input type="hidden" name="risk_profile" value={risk} />
          <p className="text-sm text-text-soft">
            Meta sugerida de <Term name="alocacao">alocação</Term>. A divisão por perfil é escolha do site, não regra oficial: cada instituição usa a sua. Você pode ajustar cada número.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TARGET_CLASSES.map((name) => (
              <div key={name} className="space-y-1 text-sm">
                <span className="block text-text-soft">{CLASS_LABEL[name]} (%)</span>
                <input
                  type="number"
                  name={name}
                  aria-label={`${CLASS_NAME[name]} (%)`}
                  min={0}
                  max={100}
                  step={1}
                  inputMode="numeric"
                  required
                  value={values[name]}
                  onChange={(e) => setValues({ ...values, [name]: e.target.value })}
                  className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <p role="status" className="text-sm text-text-soft">
            Soma: {sum}%{sum === 100 ? "" : " (precisa ser 100%)"}
          </p>
          <p className="text-xs text-muted">
            Ações dos EUA e cripto chegam em fases seguintes. Por enquanto, essa parte fica só como intenção.
          </p>
          <button
            type="submit"
            disabled={!canSave || pending}
            className="rounded-full bg-accent px-3 py-2 text-sm font-medium text-bg disabled:opacity-60"
          >
            Salvar meu perfil
          </button>
          {state && !state.ok && (
            <p role="alert" className="text-sm text-text-soft">
              {state.message}
            </p>
          )}
        </section>
      )}
    </form>
  );
}
