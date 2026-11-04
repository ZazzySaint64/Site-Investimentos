// Pure: risk questionnaire, suggested targets and the rule every target must follow.
export type RiskProfile = "conservador" | "moderado" | "arrojado";
export type TargetClass = "renda_fixa" | "acao_br" | "fii" | "acao_eua" | "cripto";
export type TargetAllocation = Record<TargetClass, number>;

export const QUESTIONS: { text: string; options: string[] }[] = [
  {
    text: "Em quanto tempo você pretende usar esse dinheiro?",
    options: ["Em menos de 2 anos", "De 2 a 5 anos", "Daqui a mais de 5 anos"],
  },
  {
    text: "Se sua carteira caísse 20% em um mês, o que você faria?",
    options: ["Venderia tudo para não perder mais", "Esperaria a situação melhorar", "Aproveitaria para investir mais"],
  },
  {
    text: "Qual é o seu principal objetivo?",
    options: [
      "Proteger o que já tenho",
      "Crescer aos poucos, com alguns altos e baixos",
      "Buscar mais retorno, aceitando perdas no caminho",
    ],
  },
  {
    text: "Quanta experiência você tem com investimentos?",
    options: ["Nenhuma ou só poupança", "Já usei renda fixa ou fundos", "Já investi em ações ou fundos imobiliários"],
  },
  {
    text: "Você tem dinheiro guardado para emergências?",
    options: ["Não tenho", "Menos de 6 meses de gastos", "6 meses de gastos ou mais"],
  },
];

export const TARGET_CLASSES: TargetClass[] = ["renda_fixa", "acao_br", "fii", "acao_eua", "cripto"];

export const TARGETS: Record<RiskProfile, TargetAllocation> = {
  conservador: { renda_fixa: 70, acao_br: 15, fii: 10, acao_eua: 5, cripto: 0 },
  moderado: { renda_fixa: 40, acao_br: 30, fii: 15, acao_eua: 10, cripto: 5 },
  arrojado: { renda_fixa: 15, acao_br: 40, fii: 15, acao_eua: 20, cripto: 10 },
};

export function riskProfileFromAnswers(answers: number[]): RiskProfile {
  if (answers.length !== QUESTIONS.length || answers.some((a) => !Number.isInteger(a) || a < 0 || a > 2)) {
    throw new Error("Expected 5 answers from 0 to 2.");
  }
  const score = answers.reduce((sum, a) => sum + a, 0);
  return score <= 3 ? "conservador" : score <= 6 ? "moderado" : "arrojado";
}

export function isRiskProfile(value: unknown): value is RiskProfile {
  return typeof value === "string" && value in TARGETS;
}

export function isValidTarget(target: unknown): target is TargetAllocation {
  if (typeof target !== "object" || target === null) return false;
  const record = target as Record<string, unknown>;
  let sum = 0;
  for (const name of TARGET_CLASSES) {
    const value = record[name];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) return false;
    sum += value;
  }
  return sum === 100;
}
