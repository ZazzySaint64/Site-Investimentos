# Fontes de cada informação e propósito do site

Pesquisa feita em 2026-11-05. Complementa [conhecimento-de-investimentos.md](conhecimento-de-investimentos.md), que usa as mesmas marcas de evidência: **[Norma]**, **[Dado]**, **[Oficial]**, **[Estudo]**, **[Mercado]** e **[A verificar]**.

Nada aqui foi implementado. São propostas para o autor decidir.

## 1. Resumo

- **Por que o site existe:** quem começa a investir no Brasil aprende, na maioria, com vídeo e rede social, e muitas vezes com alguém que ganha para indicar um produto. O site pega dado público oficial e o traduz em frase simples, com fonte e data, sem vender nada e sem dizer o que comprar.
- **Para que serve, em uma frase:** *conferir, antes de investir, o que um investimento é, quanto já oscilou, quanto rendeu contra o CDI e o que pode dar errado.*
- **Fontes:** três das quatro fontes de dados já são oficiais: Banco Central, Tesouro Nacional e CVM. O IPCA e o CDI do Banco Central repetem os números do IBGE e da B3. O ponto fraco é o Yahoo: não é oficial, não tem contrato de uso, e os preços da bolsa são dados da B3, cuja redistribuição pública pode exigir licença.
- **Textos sem fonte:** quatro frases do site são escolhas de projeto e deveriam ser ditas como tal: as faixas de oscilação, as faixas do Sharpe, a divisão de carteira por perfil e as faixas de correlação. Duas frases da jornada da planta pedem uma ressalva curta.
- **Maior mudança proposta:** uma tela "Conferir um investimento", que reúne em um lugar o que o site já calcula, na ordem em que um leigo precisa ver.

## 2. Por que o site existe

### O problema

| Fato | Fonte |
|---|---|
| YouTube (35%) e Instagram (27%) são os canais de informação mais citados por investidores. A TV caiu de 34% para 21% em cinco anos. 9% já usam IA | [Raio X do Investidor, 9ª edição, ANBIMA e Datafolha](https://static.poder360.com.br/uploads/2026/07/Raio-X-do-Investidor-9-edicao-23-jul-2026.pdf), dados de 2025 **[Oficial]** |
| A poupança está em 61% dos investidores, contra 75% em 2021 | Mesma pesquisa **[Oficial]** |
| Três em cada dez brasileiros não têm reserva financeira | [Mesma pesquisa, segundo o BB Investalk](https://investalk.bb.com.br/noticias/mercado/3-em-cada-10-brasileiros-nao-tem-reserva-financeira-mostra-raio-x-da-anbima) **[Oficial, via secundário]** |
| 75% das pessoas começaram a investir com base em conteúdo de influenciadores digitais. Os influenciadores de investimento passaram de 255 para 515 em um semestre de 2022 | Estudo da CVM de abril de 2023, [segundo a B3](https://borainvestir.b3.com.br/noticias/mercado/cvm-recomenda-regulacao-de-influenciadores-digitais-veja-o-que-pode-mudar/) **[Oficial, via secundário; o estudo não foi lido na íntegra]** |
| Aviso de "não é recomendação" não descaracteriza a análise; educação sem recomendação fica fora da regulação | Ofício circular da CVM, [segundo o Seu Dinheiro](https://www.seudinheiro.com/2020/economia/cvm-esclarece-em-que-casos-e-preciso-ter-registro-de-analista-para-postar-sobre-investimentos-nas-redes-sociais) **[Oficial, via secundário]** |

O que isso quer dizer: o iniciante chega com uma indicação ouvida em vídeo e quase nunca tem onde conferir o que ouviu sem cair em outro conteúdo patrocinado. Os dados oficiais existem e são gratuitos, mas estão espalhados em portais técnicos (CVM, Tesouro, Banco Central, IBGE), em arquivos CSV, com termos que o iniciante não conhece.

### O propósito

> O Site Investimentos existe para que uma pessoa leiga consiga conferir um investimento antes de colocar dinheiro nele, com dados públicos oficiais, em palavras simples, sem ninguém tentando vender nada.

Três compromissos decorrem disso, e o site já cumpre a maior parte:

1. **Todo número tem fonte e data.** É o que diferencia o site de um vídeo.
2. **Todo número tem uma frase que diz o que ele quer dizer, e o que ele não diz.** É o que diferencia o site de um portal técnico.
3. **Nenhuma frase diz o que comprar.** É o que mantém o site do lado da educação, conforme a [seção 9 da pesquisa anterior](conhecimento-de-investimentos.md#9-limites-regulatórios-para-o-site).

### Para quem

- **O leigo**, que é o público principal: lê a frase, abre o glossário e para por aí.
- **Quem entende**: abre "Ver mais números", confere a fonte e baixa o dado original pelo link.

### O que o site não é

- Não é corretora nem consultoria: não executa ordens e não indica ativos.
- Não é cotação em tempo real: os dados são do fim do dia anterior, ou do último informe enviado à CVM.
- Não é previsão: o que mostra é passado, e diz isso.

## 3. Para que ele serve: quatro usos

Cada uso é algo que uma pessoa faria hoje com o site, ou quase.

| Uso | O que a pessoa quer | O que o site já tem | O que falta |
|---|---|---|---|
| **1. Conferir uma indicação** | "Me falaram do MXRF11. O que é? É seguro? Rende mais que o CDI?" | Página de cada ativo: tipo calculado pela carteira, riscos do tipo, R$ 1.000 contra o CDI, oscilação, maior queda, rendimentos de 12 meses | Um ponto de entrada com esse nome, e um resumo em ordem: o que é, o que pode dar errado, como foi até aqui, de onde vêm os números |
| **2. Ver a carteira inteira** | "Tenho coisa em dois bancos e uma corretora. Quanto tenho em ações? Estou concentrado?" | Carteira com lançamentos manuais, alocação por classe, comparação com a divisão de referência do perfil | Importar da B3 (Área do Investidor), já listado como primeira candidata depois da v1 |
| **3. Fazer a conta que muda a decisão** | "LCI a 90% do CDI ou CDB a 110%? Se eu vender o Tesouro antes, perco?" | Página `/renda-fixa` com isento contra tributado e marcação a mercado | Aplicar a conta a um título real da página do Tesouro, com a taxa do dia |
| **4. Aprender com um exemplo** | "Como seria uma carteira de alguém parecido comigo?" | Carteiras de exemplo fictícias, jornada da planta, glossário | Ligar cada etapa da planta a uma tela onde a ideia aparece com dado real |

O uso 1 é o mais forte, porque responde ao problema da seção 2 e usa quase só o que já existe. A seção 6 detalha a proposta.

## 4. Fonte de cada informação

"Hoje" é a fonte em uso. "Melhor" é a fonte primária ou a mais confiável encontrada.

### Dados de mercado

| Informação no site | Hoje | Melhor fonte | Avaliação |
|---|---|---|---|
| Preço de fechamento de ações e FIIs | Yahoo, via `yfinance` | [Série histórica COTAHIST da B3](https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/mercado-a-vista/cotacoes-historicas/), oficial e gratuita, desde 1986 **[Oficial]** | Trocar quando houver tempo. O COTAHIST não ajusta proventos nem desdobramentos, então o ajuste teria de ser feito com os eventos da CVM. O `yfinance` não é afiliado ao Yahoo e usa endpoints sem contrato, [segundo o próprio projeto](https://github.com/uakbr/yfinance) **[Mercado]** |
| Preço ajustado por proventos, usado em retorno, Sharpe e maior queda | Yahoo | Calcular a partir do COTAHIST e dos proventos oficiais | O Yahoo às vezes recalcula o passado; o job já trata isso. Sem fonte oficial de preço ajustado |
| Dividendos e JCP de ações | Yahoo (`Dividends`) | Avisos aos acionistas no [conjunto IPE da CVM](https://dados.cvm.gov.br/dataset/cia_aberta-doc-ipe), atualizado toda semana **[Oficial]** | O IPE traz o documento, não o valor em campo. Extrair o valor exige ler PDF. Manter o Yahoo e citar a fonte; conferir por amostra |
| Rendimentos de FII | Yahoo (`Dividends`) | Avisos de distribuição no [Fundos.NET da B3](https://fnet.bmfbovespa.com.br/) **[Oficial]** | Mesmo problema: documento, não campo estruturado. O informe mensal da CVM traz `Rendimentos_Distribuir`, que é saldo a pagar, não valor por cota **[Dado]** |
| Ibovespa | Yahoo (`^BVSP`) | Estatísticas históricas na página do índice na B3 **[Oficial; página do Ibovespa não localizada nesta pesquisa]** | Manter o Yahoo; conferir contra a B3 uma vez por mês |
| IFIX | Não mostrado | B3 **[Oficial; download diário não localizado]** | Continua de fora até achar uma série confiável |
| Composição, valor patrimonial, cotistas, vacância e contratos dos FIIs | [Informes mensal e trimestral da CVM](https://dados.cvm.gov.br/dataset/fii-doc-inf_mensal) | A mesma | Já é a fonte oficial. Atraso de um a três meses, já mostrado na tela |
| Preço e vencimento do Tesouro Direto | Planilha do Tesouro Transparente | A mesma | Já é oficial. A [nota de metadados](https://www.tesourotransparente.gov.br/ckan/dataset/f0468ecc-ae97-4287-89c2-6d8139fb4343/resource/ab22ec7d-7ff9-4979-a3ed-fb234caae1f2/download/vendasdotesourodireto-metadados-revisado.pdf) avisa que valores podem ser revisados. A licença aparece como ODbL [em fonte secundária](https://web.do.metacpan.org/pod/Finance::Quote::TesouroDireto) **[A verificar]** |

### Dados econômicos

| Informação | Hoje | Melhor fonte | Avaliação |
|---|---|---|---|
| Selic | SGS do Banco Central, série 11 (diária) | A mesma **[Oficial]** | Já é oficial |
| CDI | SGS, série 12 | A B3 calcula e publica a [Taxa DI](https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-de-segmentos-e-setoriais/di/), com [metodologia própria de acumulado](https://b3.com.br/pt_br/market-data-e-indices/indices/indices-de-segmentos-e-setoriais/di/metodologia-de-calcudo-acumulado-de-di/) **[Oficial]** | A série do Banco Central repete o número da B3. Manter o SGS, que tem API estável, e citar a B3 como origem do número |
| IPCA | SGS, série 433 | IBGE, [tabela 1737 do SIDRA](https://seriesbr.readthedocs.io/en/stable/demos/IBGE.html), variável 63 **[Oficial]** | A série 433 repete o IBGE. Manter e citar o IBGE como origem |

### Regras e textos

| Informação | Melhor fonte | Situação no site |
|---|---|---|
| Imposto de renda de cada classe | Leis no Planalto e o [Perguntas e Respostas IRPF 2026 da Receita](https://fenacon.org.br/noticias/receita-publica-perguntas-e-respostas-irpf-2026-com-orientacoes-atualizadas-aos-contribuintes/), com 745 perguntas **[Oficial; PDF não aberto nesta pesquisa]** | Tabela regressiva e isenção de FII conferidas na norma. Mostrar a lei ao lado de cada regra. Atenção: [um blog conhecido ainda fala em 50 cotistas](https://www.suno.com.br/?p=261989), quando a lei diz 100 |
| Garantia do FGC | [Material do FGC](https://fgc.org.br/documents/d/guest/material-para-corretoras_versao-dezembro2025) **[Oficial]** | Conferido |
| Questionário de perfil | Resolução CVM 30 e a análise de perfil (API) da ANBIMA: tolerância a risco, experiência, objetivo e prazo, com validade de 24 meses, [segundo a Caixa](https://www.caixa.gov.br/voce/poupanca-e-investimentos/perguntas-frequentes-perfil-investidor/Paginas/default.aspx) **[Oficial, via secundário]** | As cinco perguntas cobrem os quatro eixos. A tela já diz que não substitui a avaliação de uma instituição |
| Divisão de referência por perfil (70/40/15% em renda fixa) | Não há fonte oficial. Cada instituição define a sua | É escolha de projeto. A tela deve dizer isso com essas palavras |
| Glossário | [Portal do Investidor da CVM](https://www.gov.br/investidor/pt-br), [B3 Edu](https://edu.b3.com.br/) e ANBIMA, conforme a pesquisa anterior | Revisar cada verbete contra uma dessas e guardar o link |
| Reserva de emergência | [Caderno de Cidadania Financeira do Banco Central](https://www.bcb.gov.br/pre/pef/port/caderno_cidadania_financeira.pdf) | A faixa de 3 a 6 meses de despesas é atribuída ao Banco Central [por fonte secundária](https://olhardigital.com.br/2026/04/21/curiosidades/quanto-polpar-para-montar-uma-reserva-de-emergencia/) **[A verificar no caderno]**. O site não cita número, o que está certo até conferir |

## 5. Frases do site que precisam de cuidado

| Frase | Onde | Situação | Proposta |
|---|---|---|---|
| "Até 15% ao ano é baixa, de 15% a 30% é média e acima disso é alta" | Glossário e frase da oscilação | Sem fonte oficial. É escolha de projeto **[Mercado]** | Acrescentar "faixas escolhidas pelo site para comparar" |
| "Acima de 1: rendeu bem para o risco que teve" | Sharpe | Regra de bolso de mercado. [Sharpe](https://web.stanford.edu/~wfsharpe/art/sr/sr.htm) não define faixa **[Estudo]** | Mesma ressalva |
| Faixas de correlação (0,3 e 0,7) | Frase da correlação | Escolha de projeto | Mesma ressalva |
| "Investir um pouco todo mês [...] diminui o peso de acertar o dia certo" | Planta, etapa Broto | Vale para quem investe do salário. Para quem já tem uma quantia parada, investir de uma vez rendeu mais em cerca de dois terços dos períodos, [segundo a Vanguard](https://militarymoneymanual.com/wp-content/uploads/2021/08/Dollar-Cost-Averaging-Just-Means-Taking-Risk-Later-Vanguard.pdf), em dados dos EUA, Reino Unido e Austrália **[Estudo]** | Trocar para "Investir parte do salário todo mês cria o hábito e tira o peso de escolher o dia certo." O estudo não contradiz essa versão |
| "Uma reserva para imprevistos evita vender na pior hora" | Planta, etapa Raízes | Raciocínio correto, sem número | Manter. Se um dia citar meses, usar o caderno do Banco Central |
| "Juros sobre juros precisam de anos" | Planta, etapa Árvore | Matemática, sem fonte necessária | Manter |

## 6. Propostas

Em ordem de valor e custo. Nenhuma depende de fonte nova.

1. **Tela "Conferir um investimento".** Uma busca por código ou nome, na página inicial. O resultado é a página do ativo que já existe, reordenada por perguntas:
   - O que é? Tipo, em uma frase, com o rótulo calculado e o glossário.
   - O que pode dar errado? Riscos do tipo, maior queda e oscilação.
   - Como foi até aqui? R$ 1.000 contra o CDI e rendimentos de 12 meses, no passado.
   - De onde vêm os números? Fonte e data de cada bloco, com link.

   Atende ao uso 1 e ao problema da seção 2 sem dizer o que comprar.
2. **Fonte e data em cada bloco.** Hoje a data geral fica no topo e a fonte no rodapé. Uma linha curta embaixo de cada bloco ("Fonte: CVM, informe de set/2026") é o que dá confiança a quem entende.
3. **Página "De onde vêm os números".** Uma tabela como a da seção 4, para o público, com link para o dado original e a fórmula de cada indicador. Cumpre o critério do design de explicar a metodologia.
4. **Ressalvas da seção 5.** Quatro frases curtas, sem mudar nenhum número.
5. **Conferência do Yahoo.** Uma vez por mês, comparar uma amostra de preços com o COTAHIST e de proventos com os avisos oficiais. Registrar a diferença no relatório do job.
6. **Perguntar à B3 sobre licença.** O [contrato do UP2DATA](https://www.b3.com.br/data/files/68/F3/BB/72/24CDF91094DCD8F9AC094EA8/UP2DATA_Commercial_Policy_2.4.5.pdf) separa uso interno de distribuição, e distribuir exige contrato. Não ficou claro se mostrar fechamento do dia anterior em um site educativo e gratuito é distribuição. Convém perguntar à B3 antes de divulgar o site, e incluir isso na consulta jurídica já pendente.

## 7. Lacunas desta pesquisa

- Não abri o PDF do Perguntas e Respostas IRPF 2026, o caderno do Banco Central nem o estudo da CVM de 2023 na íntegra.
- Não encontrei a página oficial de download diário do Ibovespa e do IFIX na B3.
- Não confirmei a licença dos dados do Tesouro Transparente nem os termos atuais do Yahoo.
- Não encontrei pesquisa oficial de 2024 a 2026 sobre influenciadores; o número de 75% é de 2023.
