// The path "Por onde começar": the six stages of the plant, each with the tool that helps with it.
// Pure. A step is marked only when the person's own records show it; nothing is saved for it.

export type StepId = "semente" | "raizes" | "broto" | "galhos" | "seca" | "arvore";

export type Step = {
  id: StepId;
  stage: string;
  title: string;
  why: string;
  links: { href: string; label: string }[];
  doneWhen: string | null; // what the site looks at; null when it cannot tell
};

export const STEPS: Step[] = [
  {
    id: "semente",
    stage: "Semente",
    title: "Entender o básico e o seu perfil",
    why: "Saber quanto risco você aguenta antes de escolher qualquer coisa.",
    links: [
      { href: "/questionario", label: "Responder o questionário" },
      { href: "/glossario", label: "Abrir o glossário" },
    ],
    doneWhen: "Marcado quando o questionário está respondido.",
  },
  {
    id: "raizes",
    stage: "Raízes",
    title: "Montar a reserva para imprevistos",
    why: "Com a reserva, um gasto de surpresa não obriga a vender na pior hora.",
    links: [{ href: "/primeiros-passos#reserva", label: "Calcular minha reserva" }],
    doneWhen: "Marcado quando há uma renda fixa com liquidez diária lançada.",
  },
  {
    id: "broto",
    stage: "Broto",
    title: "Criar o hábito de aportar",
    why: "Um valor por mês pesa menos que acertar o dia certo.",
    links: [{ href: "/primeiros-passos#aportes", label: "Simular meus aportes" }],
    doneWhen: "Marcado quando há compras em três meses diferentes.",
  },
  {
    id: "galhos",
    stage: "Galhos",
    title: "Conhecer o risco de cada tipo",
    why: "Renda fixa, ações e fundos imobiliários caem por motivos diferentes.",
    links: [
      { href: "/conferir", label: "Conferir um investimento" },
      { href: "/renda-fixa", label: "Contas da renda fixa" },
    ],
    doneWhen: null,
  },
  {
    id: "seca",
    stage: "Seca",
    title: "Ver o tamanho das quedas",
    why: "Toda carteira passa por quedas. Ver as de antes ajuda a não se assustar com a próxima.",
    links: [{ href: "/dados", label: "Abrir um ativo e ver a maior queda" }],
    doneWhen: null,
  },
  {
    id: "arvore",
    stage: "Árvore",
    title: "Acompanhar a sua carteira",
    why: "Ver o resultado, os proventos e a comparação com o CDI e a inflação.",
    links: [
      { href: "/carteira", label: "Abrir minha carteira" },
      { href: "/carteira/importar", label: "Importar da B3" },
    ],
    doneWhen: "Marcado quando há pelo menos uma compra lançada.",
  },
];

export type Records = {
  hasProfile: boolean;
  dailyLiquidity: boolean;
  purchaseDates: string[];
};

export function doneSteps(records: Records): Set<StepId> {
  const done = new Set<StepId>();
  if (records.hasProfile) done.add("semente");
  if (records.dailyLiquidity) done.add("raizes");
  if (new Set(records.purchaseDates.map((date) => date.slice(0, 7))).size >= 3) done.add("broto");
  if (records.purchaseDates.length > 0) done.add("arvore");
  return done;
}
