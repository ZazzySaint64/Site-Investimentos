# Comparação com outros sites e o que falta

Pesquisa feita em 2026-11-06. Parte do propósito definido em [fontes-e-proposito.md](fontes-e-proposito.md): ajudar uma pessoa leiga a conferir um investimento antes de colocar dinheiro nele, com dados públicos, em palavras simples e sem dizer o que comprar.

Nada aqui foi implementado. São propostas para o autor decidir.

## 1. Resumo

- **O que os outros têm e este site não tem:** calculadoras de reserva e de aportes, proventos e rentabilidade dentro da carteira, importação da B3, ajuda com o imposto de renda e um caminho de aprendizado em etapas.
- **O que este site tem e os outros não destacam:** fonte e data em cada número, a frase do que o número não diz, rótulo de FII calculado pela carteira real e nenhum produto à venda.
- **O que não copiar:** rankings, notas de ativos e filtros por dividend yield. Viram sugestão de compra, e um site sem registro na CVM não pode fazer isso.
- **Recomendação:** começar pelas duas calculadoras que faltam na jornada da planta (reserva e aportes) e pelos proventos na carteira. São as que mais servem ao leigo e custam menos.

## 2. Os sites comparados

| Site | O que é | Como ganha dinheiro | O que oferece de mais útil |
|---|---|---|---|
| **Investidor de Verdade (IdV)** | Escola de investimentos de Matheus Nogueira, com o método "Metodologia de Verdade" e a plataforma Oráculo | Curso pago por turmas, com lista de espera. Um aluno relatou [ter pago cerca de R$ 3.700](https://investidor10.com.br/comunidade/acoes/pessoal-tudo-bem-138520/) | [Calculadoras gratuitas de renda passiva e de reserva de emergência](https://investidordeverdade.com/), aulas gratuitas, e no [Oráculo](https://oraculo.investidordeverdade.com/) "trilhas personalizadas" e consultoria. O site diz não ter vínculo com banco ou corretora |
| **Investidor10** | Portal de análise e carteira | Plano gratuito e plano PRO | [Carteira com integração à B3](https://investidor10.com.br/conteudo/gerenciador-de-carteira-de-investimentos-investidor10-como-funciona-e-quais-recursos-oferece-121429/), [comparador de até cinco ativos](https://investidor10.com.br/conteudo/comparador-de-ativos-122067/), [rankings e filtros](https://investidor10.com.br/conteudo/rankings-do-investidor10-encontre-e-compare-ativos-por-indicadores-122006/) por P/L, P/VP, ROE e DY, ajuda com IRPF |
| **Status Invest** | Portal de indicadores do Grupo Suno | Conteúdo pago e a casa de análise do grupo | Indicadores fundamentalistas, histórico de proventos, carteira |
| **Kinvo** | App de consolidação, [comprado pelo BTG](https://www.baguete.com.br/noticias/btg-pactual-compra-kinvo-por-r-72-milhoes) | Plano Premium | [Conexão com a B3 só de leitura](https://renovainvest.com.br/?p=19889) para ações, FIIs, BDRs e Tesouro; comparação com CDI, IPCA e Ibovespa; metas; cobertura do FGC no Premium |
| **Gorila** | Consolidação, com foco também em escritórios | Planos profissionais | [Integração com a B3 ou lançamento manual](https://exame.com/pme/app-que-une-investimentos-em-um-so-lugar-recebe-aporte-de-r-35-mi), relatórios, sugestão de rebalanceamento sem executar ordens |
| **Portais oficiais** (CVM, B3 Edu, Banco Central, Tesouro Direto) | Educação e dados públicos | Não vendem nada | Conteúdo confiável e simuladores, espalhados em vários sites |

Quase toda a informação sobre os portais comerciais vem das páginas deles próprios ou de análises de terceiros **[Mercado]**. A plataforma Oráculo exige login, e as páginas abertas não descrevem ferramentas de carteira, notas ou rebalanceamento.

## 3. Comparação por necessidade

✓ tem, ~ tem em parte, ✗ não tem. "Este site" inclui o que já está na branch `fase-3`.

| O que a pessoa precisa | IdV | Investidor10 | Kinvo | Este site |
|---|:-:|:-:|:-:|:-:|
| Aprender do zero, em etapas | ✓ curso e trilhas | ~ artigos | ✗ | ~ jornada da planta e glossário, sem etapas práticas |
| Saber quanto guardar de reserva | ✓ calculadora | ✗ | ✗ | ✗ só a frase da etapa Raízes |
| Ver quanto os aportes podem virar com o tempo | ✓ calculadora de renda passiva | ✗ | ~ metas | ✗ previsto como Monte Carlo, ainda não feito |
| Entender um ativo antes de comprar | ✗ | ✓ muitos indicadores | ✗ | ✓ tela Conferir, em linguagem simples |
| Saber de onde vem cada número | ✗ | ~ | ✗ | ✓ fonte e data |
| Comparar dois ou três ativos | ✗ | ✓ até cinco | ✗ | ✗ |
| Indicadores de empresas (P/L, ROE) | ✗ | ✓ | ✗ | ✗ |
| Montar a carteira sem digitar tudo | ✗ | ✓ B3 | ✓ B3 | ✗ só lançamento manual |
| Ver proventos recebidos | ✗ | ✓ | ✓ | ✗ os dados já estão no banco, mas a carteira não usa |
| Rentabilidade da carteira contra CDI e IPCA no tempo | ✗ | ✓ | ✓ | ~ só o resultado total |
| Divisão por classe contra uma meta | ✗ | ~ | ✓ | ✓ |
| Cobertura do FGC por banco | ✗ | ✗ | ✓ pago | ✗ |
| Ajuda com o imposto de renda | ✗ | ✓ | ~ | ~ só a tabela regressiva na conta de renda fixa |
| Contas de renda fixa (isento contra tributado, juros) | ✗ | ✗ | ✗ | ✓ |
| Sem nada à venda | ✗ | ✗ | ✗ | ✓ |

## 4. O que falta, em ordem de valor

Cada item diz que necessidade atende e por que cabe no propósito.

### 4.1 Calculadora de reserva de emergência

- **Necessidade:** três em cada dez brasileiros não têm reserva ([Raio X da ANBIMA](https://investalk.bb.com.br/noticias/mercado/3-em-cada-10-brasileiros-nao-tem-reserva-financeira-mostra-raio-x-da-anbima)). É o primeiro passo de qualquer guia, e é a etapa Raízes da planta.
- **Como:** a pessoa informa gastos do mês e se a renda é estável. A tela mostra a faixa de meses de reserva, quanto falta e quanto tempo leva guardando um valor por mês, com o CDI do banco. Explica onde a reserva costuma ficar (liquidez diária, Tesouro Selic, FGC) sem citar produto de banco.
- **Antes de publicar:** conferir a faixa de meses no [caderno do Banco Central](https://www.bcb.gov.br/pre/pef/port/caderno_cidadania_financeira.pdf). Hoje ela só aparece em fonte secundária.
- **Custo:** baixo. Só conta e texto, como a página `/renda-fixa`.

### 4.2 Simulador de aportes ao longo do tempo

- **Necessidade:** a etapa Árvore fala de juros sobre juros, mas não deixa a pessoa fazer a conta com o próprio valor.
- **Como:** aporte por mês, prazo e uma taxa. A tela mostra o total aportado e o total com juros, em valor de hoje, descontando a inflação. Para não virar promessa, a taxa padrão é o CDI do banco menos o IPCA dos últimos 12 meses, e a tela mostra também uma faixa com o pior e o melhor ano do histórico. O Monte Carlo do design pode substituir a faixa depois.
- **Custo:** baixo a médio.

### 4.3 Proventos e rentabilidade na carteira

- **Necessidade:** quem tem FII quer ver quanto recebeu. Hoje a carteira ignora proventos, o que subestima o resultado de quem tem FIIs e ações que pagam muito.
- **Como:** a tabela `dividends` já existe. Para cada compra, somar os proventos com data posterior à compra e anterior à venda, vezes a quantidade. Mostrar o total recebido em 12 meses e a rentabilidade contra o CDI e o IPCA no mesmo período.
- **Custo:** médio. A regra de quantidade por data já existe para os desdobramentos.

### 4.4 Importar o extrato da B3

- **Necessidade:** digitar cada compra é a maior barreira para usar a carteira. Todos os concorrentes de carteira importam da B3.
- **Como:** a própria pessoa baixa o extrato de negociação na Área do Investidor da B3 e envia o arquivo ao site. O site lê o arquivo no navegador e mostra o que vai lançar antes de salvar. Não depende de contrato com a B3, porque o arquivo é da pessoa. A conexão direta com a B3, como a do Kinvo, exige parceria e fica para depois.
- **Antes de começar:** conseguir um arquivo de exemplo real, sem dados pessoais, para saber o formato.
- **Custo:** médio.

### 4.5 Caminho "Por onde começar"

- **Necessidade:** o IdV vende exatamente isso, um caminho em etapas. O site já tem as peças, mas não as liga.
- **Como:** transformar as seis etapas da planta em uma lista de passos, cada um com uma ferramenta: Raízes leva à reserva, Broto ao simulador de aportes, Galhos ao Conferir e às contas de renda fixa, Seca à maior queda da carteira de exemplo, Árvore à própria carteira. Com login, marcar os passos feitos.
- **Custo:** baixo, depois de 4.1 e 4.2.

### 4.6 Ajuda com o imposto de renda

- **Necessidade:** é a dúvida mais comum depois de começar, e erro custa caro.
- **Como, em ordem:** (a) avisar quando as vendas de ações do mês passam de R$ 20 mil; (b) calcular o lucro de cada venda pelo preço médio; (c) listar as posições em 31/12 pelo custo, que é o que vai em "Bens e direitos". Sempre com a lei e a página da Receita ao lado.
- **Antes de começar:** ler o [Perguntas e Respostas IRPF](https://fenacon.org.br/noticias/receita-publica-perguntas-e-respostas-irpf-2026-com-orientacoes-atualizadas-aos-contribuintes/) da Receita. O design pôs imposto de renda fora da v1, então isso muda o escopo.
- **Custo:** alto, por causa da exatidão exigida.

### 4.7 Comparar dois ou três ativos

- **Necessidade:** "HGLG11 ou KNCR11?" é uma pergunta comum.
- **Como:** colunas lado a lado com o que a tela Conferir já mostra, mais o CDI. Sem ordenar nem destacar um vencedor, e com a frase de que tijolo e papel não se comparam pelos mesmos indicadores.
- **Custo:** baixo a médio.

### 4.8 Cobertura do FGC na carteira

- **Necessidade:** quem tem CDB em vários bancos não sabe se passou do limite de R$ 250 mil por instituição.
- **Como:** um campo de instituição no lançamento de renda fixa e um aviso quando a soma passa do limite.
- **Custo:** baixo.

### 4.9 Indicadores de empresas

- **Necessidade:** é o centro do Investidor10 e do Status Invest.
- **Como:** demonstrações da CVM (DFP e ITR), conforme a [pesquisa anterior](conhecimento-de-investimentos.md#51-ações), sempre comparando dentro do setor e com a armadilha de cada indicador.
- **Custo:** alto. Fica depois do resto.

## 5. O que fica de fora de propósito

| Recurso dos outros | Por que não |
|---|---|
| Ranking de ativos, "melhores FIIs" | É ranking por atratividade, que a [seção 9 da pesquisa](conhecimento-de-investimentos.md#9-limites-regulatórios-para-o-site) põe do lado do "não pode" |
| Filtro ou ordenação por dividend yield | Yield alto costuma vir de preço caído ou risco maior. Ordenar por ele sugere qualidade |
| Nota ou semáforo de compra | Recomendação |
| Consultoria ou "trilha personalizada" que indique produtos | Exige registro na CVM (Resolução 19) |
| Comunidade e comentários sobre ativos | Moderação e risco de recomendação de terceiros dentro do site |

## 6. Lacunas desta pesquisa

- Não vi o Oráculo do IdV por dentro, porque exige login. As ferramentas dele podem ser mais completas do que as páginas abertas mostram.
- As informações sobre Investidor10, Kinvo e Gorila vêm dos próprios sites ou de análises de terceiros, e planos e limites mudam.
- Não testei os apps como usuário.
