// Static glossary. Every technical word on the screens opens one of these entries.

export const GLOSSARY = {
  retorno: {
    title: "Retorno ao ano",
    text: "Quanto o ativo rendeu, em média, a cada ano do período. Inclui proventos. Olha só para o passado.",
  },
  volatilidade: {
    title: "Oscilação (volatilidade)",
    text: "Mostra o quanto o preço sobe e desce. Quanto maior, mais sustos no caminho, para cima e para baixo. Até 15% ao ano é baixa, de 15% a 30% é média e acima disso é alta.",
  },
  queda: {
    title: "Maior queda",
    text: "A maior perda de quem comprou no ponto mais alto e vendeu no ponto mais baixo seguinte. Ajuda a imaginar o pior momento do período.",
  },
  sharpe: {
    title: "Retorno pelo risco (Sharpe)",
    text: "Compara o que o ativo rendeu acima do CDI com o quanto ele oscilou. Negativo: rendeu menos que o CDI. Acima de 1: rendeu bem para o risco que teve.",
  },
  correlacao: {
    title: "Relação com o Ibovespa (correlação)",
    text: "Vai de −1 a +1. Perto de +1, o ativo costuma subir e cair junto com a bolsa. Perto de zero, um não diz muito sobre o outro.",
  },
  proventos: {
    title: "Proventos",
    text: "Dinheiro que o ativo paga a quem o possui, como dividendos de ações e rendimentos de fundos imobiliários.",
  },
  cdi: {
    title: "CDI",
    text: "Taxa de juros usada como régua da renda fixa. Muitos investimentos conservadores prometem render um percentual dela.",
  },
  selic: {
    title: "Selic",
    text: "Taxa básica de juros do Brasil, definida pelo Banco Central. Quando ela sobe, a renda fixa tende a render mais.",
  },
  ipca: {
    title: "IPCA",
    text: "Inflação oficial do Brasil. Mede o quanto os preços subiram. Um investimento só ganha poder de compra se render mais que ela.",
  },
  acao: {
    title: "Ação",
    text: "Um pedacinho de uma empresa negociado na bolsa. O preço pode subir ou cair bastante.",
  },
  fii: {
    title: "Fundo imobiliário (FII)",
    text: "Fundo que investe em imóveis ou em títulos ligados a imóveis. Costuma pagar rendimentos todo mês, que podem variar.",
  },
  tesouro: {
    title: "Tesouro Direto",
    text: "Títulos do governo federal comprados pela internet. O preço muda todo dia, mas o valor combinado é pago se você ficar até o vencimento.",
  },
  ibovespa: {
    title: "Ibovespa",
    text: "Índice que resume o desempenho das maiores ações da bolsa brasileira. Serve de comparação, e não pode ser comprado diretamente.",
  },
  carteira: {
    title: "Carteira",
    text: "O conjunto de tudo o que uma pessoa investiu. Olhar a carteira inteira mostra melhor o risco do que olhar um ativo sozinho.",
  },
  resultado: {
    title: "Resultado",
    text: "Quanto a carteira ganhou ou perdeu até hoje. Soma o que já foi embolsado nas vendas com a diferença entre o preço de hoje e o preço pago no que continua na carteira. Não conta proventos, impostos nem custos.",
  },
  preco_medio: {
    title: "Preço médio",
    text: "O preço pago por cada unidade, em média, considerando todas as compras. Serve para saber se o preço de hoje está acima ou abaixo do que foi pago.",
  },
  alocacao: {
    title: "Alocação",
    text: "Como o dinheiro está dividido entre os tipos de investimento. Colocar tudo em um só tipo aumenta o risco.",
  },
  desdobramento: {
    title: "Desdobramento e grupamento",
    text: "A empresa muda o número de ações sem mudar o valor total. No desdobramento, cada ação vira várias e o preço cai na mesma proporção. No grupamento, ocorre o contrário.",
  },
  renda_fixa: {
    title: "Renda fixa",
    text: "Investimento em que as regras de rendimento são combinadas na hora da compra, como um CDB que rende um percentual do CDI. O valor mostrado aqui é uma estimativa e não conta impostos.",
  },
  liquidez_diaria: {
    title: "Liquidez diária",
    text: "Possibilidade de resgatar o dinheiro em qualquer dia útil, sem esperar o vencimento.",
  },
  perfil_risco: {
    title: "Perfil de risco",
    text: "Quanto você aceita ver o valor oscilar para tentar render mais. Serve para comparar a sua carteira com uma divisão de referência, sem dizer o que comprar.",
  },
  pregao: {
    title: "Pregão",
    text: "Cada dia em que a bolsa funciona. Fins de semana e feriados não contam.",
  },
} satisfies Record<string, { title: string; text: string }>;

export type GlossaryKey = keyof typeof GLOSSARY;
