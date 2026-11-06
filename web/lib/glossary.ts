// Static glossary. Every technical word on the screens opens one of these entries.

export const GLOSSARY = {
  retorno: {
    title: "Retorno ao ano",
    text: "Quanto o ativo rendeu, em média, a cada ano do período. Inclui proventos. Olha só para o passado.",
  },
  volatilidade: {
    title: "Oscilação (volatilidade)",
    text: "Mostra o quanto o preço sobe e desce. Quanto maior, mais sustos no caminho, para cima e para baixo. O site chama de baixa até 15% ao ano, de média de 15% a 30% e de alta acima disso. São faixas escolhidas pelo site para comparar, sem regra oficial.",
  },
  queda: {
    title: "Maior queda",
    text: "A maior perda de quem comprou no ponto mais alto e vendeu no ponto mais baixo seguinte. Ajuda a imaginar o pior momento do período.",
  },
  sharpe: {
    title: "Retorno pelo risco (Sharpe)",
    text: "Compara o que o ativo rendeu acima do CDI com o quanto ele oscilou. Negativo: rendeu menos que o CDI. Acima de 1, o site diz que rendeu bem para o risco. Essa faixa é costume de mercado, não regra oficial.",
  },
  correlacao: {
    title: "Relação com o Ibovespa (correlação)",
    text: "Vai de −1 a +1. Perto de +1, o ativo costuma subir e cair junto com a bolsa. Perto de zero, um não diz muito sobre o outro. Nas frases, o site usa 0,3 e 0,7 como limites.",
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
  fii_tijolo: {
    title: "FII de tijolo",
    text: "Fundo que tem imóveis e recebe aluguel. O rendimento depende de os imóveis estarem ocupados e de os inquilinos pagarem.",
  },
  fii_papel: {
    title: "FII de papel",
    text: "Fundo que empresta dinheiro ao setor imobiliário por meio de títulos, como CRI. O rendimento vem de juros, e o principal risco é o devedor não pagar.",
  },
  fundo_de_fundos: {
    title: "Fundo de fundos",
    text: "Fundo que compra cotas de outros fundos imobiliários. Diversifica, mas soma as taxas dele às dos outros.",
  },
  fii_hibrido: {
    title: "FII híbrido",
    text: "Fundo que mistura imóveis, títulos ou outras cotas, e por isso soma os riscos de cada parte. Aqui, é o rótulo de quem não tem dois terços da carteira em um só tipo.",
  },
  fii_desenvolvimento: {
    title: "FII de desenvolvimento",
    text: "Fundo que constrói imóveis para vender ou alugar. O resultado depende da obra e das vendas, e a renda pode ser irregular.",
  },
  cota: {
    title: "Cota",
    text: "A parte do fundo que você compra. Para sair de um FII, é preciso vender a outra pessoa, porque o fundo não devolve o dinheiro a pedido.",
  },
  valor_patrimonial: {
    title: "Valor patrimonial da cota",
    text: "O patrimônio do fundo dividido pelo número de cotas. Depende de avaliações e pode não ser o preço pelo qual os ativos seriam vendidos.",
  },
  pvp: {
    title: "P/VP",
    text: "Preço da cota dividido pelo valor patrimonial. Abaixo de 1, o mercado paga menos que o valor contábil, o que não prova que está barato.",
  },
  dividend_yield: {
    title: "Dividend yield",
    text: "Quanto o ativo pagou em 12 meses, em relação ao preço de hoje. Olha para o passado e sobe quando o preço cai.",
  },
  rendimento_fii: {
    title: "Rendimento do FII",
    text: "Dinheiro que o fundo distribui aos cotistas, em geral todo mês. Pode mudar e não é garantido.",
  },
  amortizacao: {
    title: "Amortização",
    text: "Quando o fundo devolve parte do valor da cota. Não é lucro: você recebe de volta parte do que já era seu.",
  },
  vacancia: {
    title: "Vacância",
    text: "Parte dos imóveis que está sem inquilino. Imóvel vazio não paga aluguel. Aqui, é a física: área vazia sobre a área total.",
  },
  inadimplencia: {
    title: "Inadimplência",
    text: "Quando quem deve não paga no prazo, seja o inquilino de um imóvel, seja o devedor de um título.",
  },
  wault: {
    title: "WAULT e prazo dos contratos",
    text: "Tempo médio que falta para os contratos de aluguel acabarem, pesando mais os que rendem mais. Quanto maior, mais previsível tende a ser a receita.",
  },
  contrato_atipico: {
    title: "Contrato atípico",
    text: "Aluguel feito sob medida, em geral longo e com multa alta para sair. Dá previsibilidade, mas depende muito daquele inquilino.",
  },
  cap_rate: {
    title: "Cap rate",
    text: "Renda anual de um imóvel dividida pelo seu valor. É o quanto o imóvel rende, sem contar a oscilação do preço da cota.",
  },
  cri: {
    title: "CRI",
    text: "Título que transforma dívidas ligadas a imóveis em investimento. Não tem garantia do FGC.",
  },
  ltv: {
    title: "LTV",
    text: "Tamanho da dívida em relação ao valor do imóvel dado em garantia. Quanto menor, maior a folga se for preciso vender o imóvel.",
  },
  spread: {
    title: "Spread",
    text: "Quanto um título paga acima do seu indexador. Em geral, spread maior é pagamento por mais risco.",
  },
  subordinacao: {
    title: "Subordinação",
    text: "Parte do investimento que absorve as perdas antes das outras. Protege quem está à frente e arrisca mais quem está atrás.",
  },
  high_grade: {
    title: "High grade",
    text: "Crédito de devedores mais sólidos, com juros menores. Não há uma regra oficial para o termo.",
  },
  high_yield: {
    title: "High yield",
    text: "Crédito de devedores mais arriscados, com juros maiores. Juro alto paga risco, não é ganho garantido.",
  },
  marcacao_mercado: {
    title: "Marcação a mercado",
    text: "Atualização diária do preço de um título. Quem vende antes do vencimento recebe o preço do dia, que pode ser menor que o pago.",
  },
  duration: {
    title: "Duration",
    text: "Medida de quanto o preço de um título reage aos juros. Quanto maior, maior o sobe e desce.",
  },
  come_cotas: {
    title: "Come-cotas",
    text: "Imposto que alguns fundos retêm em maio e novembro, reduzindo a quantidade de cotas.",
  },
  fgc: {
    title: "FGC",
    text: "Fundo privado que devolve até R$ 250 mil por pessoa e por banco, se o banco quebrar. Não cobre Tesouro, CRI, debênture, ações nem FII.",
  },
  ifix: {
    title: "IFIX",
    text: "Índice que acompanha os fundos imobiliários mais negociados, contando cotação e rendimentos.",
  },
  diluicao: {
    title: "Diluição",
    text: "Quando o fundo emite cotas novas e sua fatia fica menor, se você não comprar a sua parte.",
  },
  jcp: {
    title: "JCP",
    text: "Juros sobre capital próprio: forma de a empresa pagar acionistas. Tem 17,5% de imposto na fonte.",
  },
  pl: {
    title: "P/L",
    text: "Preço da ação dividido pelo lucro por ação. Só faz sentido comparado a empresas parecidas.",
  },
  payout: {
    title: "Payout",
    text: "Parte do lucro que a empresa distribui. Acima de 100%, paga mais do que lucrou, o que pode não durar.",
  },
  taxa_administracao: {
    title: "Taxa de administração",
    text: "O que o fundo paga a quem o administra e gere, tirado do patrimônio. Sai do retorno de todos os cotistas.",
  },
  cotistas: {
    title: "Cotistas",
    text: "As pessoas e empresas donas de cotas do fundo. Com menos de 100, o rendimento do FII deixa de ser isento para pessoa física.",
  },
  isencao_fii: {
    title: "Isenção do rendimento de FII",
    text: "O rendimento mensal é isento para pessoa física se o fundo tiver ao menos 100 cotistas e cotas negociadas só em bolsa ou balcão organizado, e se a pessoa tiver menos de 10% das cotas, entre outras condições. O lucro na venda da cota paga 20%.",
  },
  tabela_regressiva: {
    title: "Tabela regressiva",
    text: "Imposto de renda da maior parte da renda fixa, que cai com o tempo: 22,5% até 180 dias, 20% até 360, 17,5% até 720 e 15% depois disso.",
  },
  lci_lca: {
    title: "LCI e LCA",
    text: "Títulos de banco ligados a crédito imobiliário e do agronegócio. O rendimento é isento para pessoa física, têm garantia do FGC e prazo mínimo antes do resgate.",
  },
} satisfies Record<string, { title: string; text: string }>;

export type GlossaryKey = keyof typeof GLOSSARY;
