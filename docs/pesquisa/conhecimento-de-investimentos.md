# Conhecimento de investimentos para o Site Investimentos

Pesquisa feita em 2026-11-04. É a base para aplicar estes conceitos no sistema em fases futuras. Nada aqui foi implementado.

Este documento é material técnico e educativo. Ele não é recomendação de investimento nem parecer jurídico ou tributário.

## Como ler

Cada afirmação importante traz um nível de evidência:

| Marca | Significado |
|---|---|
| **[Norma]** | Li o texto da lei ou da norma na fonte oficial |
| **[Dado]** | Medi em dados abertos, nesta pesquisa |
| **[Oficial]** | Vem de material da CVM, B3, ANBIMA, FGC ou órgão público, sem ser a norma |
| **[Estudo]** | Vem de artigo acadêmico ou estudo de mercado; indica se li só o resumo |
| **[Mercado]** | Prática de mercado, vista em fontes secundárias. Não há definição oficial |
| **[A verificar]** | As fontes divergem ou não consegui ler a fonte primária. Não publicar sem conferir |

Regras tributárias e normas mudam. A seção 12 lista o que reconferir antes de publicar cada fato.

## 1. O que esta pesquisa muda no sistema

1. **"Tijolo" e "papel" não são categorias oficiais.** A norma da ANBIMA usa mandato: renda, desenvolvimento, títulos e valores mobiliários, e híbrido. Tijolo e papel são linguagem de mercado. O site deve usar os termos do público e explicar o termo formal.
2. **A classificação oficial não basta para a tela.** Nos dados da CVM de 2026, o campo `Mandato` veio vazio em todos os registros, e `Segmento_Atuacao` chama MXRF11 de "Logística", embora 75% da carteira esteja em CRI. A composição real da carteira é o dado confiável (seção 10).
3. **Os dados para explicar FIIs já são públicos e gratuitos.** A CVM publica composição, cotistas, valor patrimonial, vacância por imóvel e vencimento de contratos. Isso cabe no job noturno atual. Não publica spread, LTV por CRI, cap rate nem WAULT prontos.
4. **FII de papel é crédito, não imóvel.** Essa é a confusão mais perigosa para iniciantes. O risco principal é o devedor não pagar. O site deve dizer isso sempre que mostrar um fundo desse tipo.
5. **Dividend yield alto costuma significar preço caído ou risco.** Mostrar o número sem contexto induz erro. Nunca ordenar uma lista por yield como se fosse qualidade.
6. **A fronteira regulatória precisa de atenção de um advogado.** A definição de "relatório de análise" da Resolução CVM 20 é ampla, e o site mostra análises de ativos específicos (seção 9).
7. **Várias "regras" repetidas na internet estão erradas ou antigas.** A isenção de R$ 20 mil não vale para FII, o mínimo de cotistas é 100 e não 50, e os prazos de LCI e LCA mudaram duas vezes desde 2024.

## 2. Mapa das classes

| Classe | O que a pessoa tem | De onde vem o retorno | Principal risco | Garantia do FGC |
|---|---|---|---|---|
| Tesouro Direto | Dívida do governo federal | Juros e correção | Marcação a mercado na venda antecipada | Não; o risco é o do Tesouro Nacional |
| CDB, RDB, LC | Dívida de banco | Juros | Banco quebrar; liquidez | Sim, dentro do limite |
| LCI, LCA, LCD | Dívida de banco ligada a crédito setorial | Juros | Banco quebrar; carência | Sim, dentro do limite |
| CRI, CRA | Dívida securitizada | Juros | Crédito do devedor; liquidez | Não |
| Debênture | Dívida de empresa | Juros | Crédito da empresa; liquidez | Não |
| Ação | Parte de uma empresa | Lucros e valorização | Resultado da empresa; preço | Não |
| FII | Cota de um fundo fechado | Aluguéis, juros de títulos, venda de ativos | Depende do tipo; preço da cota | Não |
| ETF | Cota de fundo que segue um índice | O índice | Mercado | Não |
| BDR | Recibo de ação estrangeira | Empresa e câmbio | Mercado e câmbio | Não |
| Fundo aberto | Cota de carteira gerida | A carteira, menos taxas | Depende da carteira | Não |
| Previdência | Plano PGBL ou VGBL | O fundo do plano | Taxas; regime de imposto | Não |

Base: lista de créditos cobertos no [material do FGC](https://fgc.org.br/documents/d/guest/material-para-corretoras_versao-dezembro2025) **[Oficial]**. As demais linhas sem cobertura decorrem de não estarem nessa lista. Instrumentos com cláusula de subordinação ficam de fora.

## 3. Fundos imobiliários

### 3.1 O que a lei diz

- É um condomínio fechado, e o resgate de cotas é proibido ([Lei 8.668, art. 2º](https://www.planalto.gov.br/ccivil_03/leis/l8668.htm)) **[Norma]**. A saída é vender a cota a outra pessoa. A CVM alerta que [não há garantia de haver comprador](https://www.gov.br/investidor/pt-br/educacional/publicacoes-educacionais/guias/guia-de-fundos-de-investimento-imobiliarios.pdf/@@download/file/Guia%20de%20Fundos%20de%20Investimento%20Imobili%C3%A1rios.pdf) **[Oficial]**.
- O cotista não exerce direito sobre os imóveis e não responde pessoalmente por obrigações deles, salvo pagar as cotas que subscreveu (Lei 8.668, art. 13) **[Norma]**.
- O fundo deve distribuir no mínimo 95% dos lucros apurados **em regime de caixa**, com base em balanço semestral de 30/6 e 31/12 (Lei 8.668, art. 10, parágrafo único) **[Norma]**. A lei não exige pagamento mensal. O mensal é prática dos fundos.
- A norma atual da CVM é a [Resolução 175, Anexo III](https://conteudo.cvm.gov.br/export/sites/cvm/legislacao/resolucoes/anexos/100/resol175consolid_Anexo03.pdf), que substituiu a Instrução 472. O art. 40 lista o que o fundo pode comprar: direitos sobre imóveis, ações e cotas de sociedades do setor, CEPAC, cotas de outros FIIs, CRI, letras hipotecárias, LCI, LIG e outros valores mobiliários do setor **[Norma]**.
- A CVM afirma que FII [não é renda fixa](https://www.investidor.gov.br/menu/Menu_Investidor/valores_mobiliarios/fundos_imobiliarios.html), porque há vacância e inadimplência e porque a cota oscila **[Oficial]**.
- Uma [reforma do Anexo III](https://conteudo.cvm.gov.br/audiencias_publicas/ap_sdm/2025/sdm0625.html) foi a consulta pública até janeiro de 2026. Trata, entre outros pontos, de subclasses com subordinação e de ofertas de aquisição. Não encontrei a norma final **[A verificar]**.

### 3.2 Três formas de classificar

**Formal, da ANBIMA.** A [Deliberação 62, de 2015](https://www.anbima.com.br/data/files/9F/21/46/B7/FBC575106582A275862C16A8/DeliberacaoN_2062_ClassificacaoFII_1_.pdf), combina mandato e tipo de gestão, usando como corte 2/3 do patrimônio **[Norma de autorregulação; confirmar se há versão mais nova]**:

| Mandato | Mais de 2/3 do patrimônio em |
|---|---|
| Desenvolvimento para Renda | Imóveis em projeto ou construção, para alugar |
| Desenvolvimento para Venda | Imóveis em projeto ou construção, para vender |
| Renda | Imóveis prontos, para alugar ou arrendar |
| Títulos e Valores Mobiliários | CRI, LCI, cotas de FII, ações e afins |
| Híbrido | Sem concentração em nenhum dos anteriores |

- **Gestão passiva:** o regulamento define os imóveis ou o fundo segue um índice. **Gestão ativa:** todos os demais.
- **Segmentos:** agências, educacional, híbrido, hospital, hotel, lajes corporativas, logística, residencial, shoppings, títulos e valores mobiliários, outros.

**De mercado.** Tijolo, papel, fundo de fundos, híbrido e desenvolvimento. A [B3 usa tijolo e papel](https://edu.b3.com.br/w/fii-tijolo) em material educativo **[Oficial]**, mas não como norma.

**Por resultado, proposta em 2026.** A associação LAREAL [propõe classificar pelo resultado real](https://www.seudinheiro.com/2026/bolsa-dolar/um-fundo-imobiliario-duas-versoes-o-que-falta-para-os-fiis-falarem-a-lingua-do-investidor-estrangeiro-igdl/), com corte de 75% e revisão anual: tijolo, papel, fundo de fundos, desenvolvimento e multiestratégia. Pelo levantamento dela, 110 dos 301 fundos mais líquidos mudariam de categoria **[Mercado; dado da própria entidade, via imprensa]**. Isso confirma que a categoria do regulamento pode não mostrar o que o fundo faz hoje.

### 3.3 Os tipos, na linguagem do site

**FII de tijolo.** Tem imóveis e recebe aluguel. A [B3 cita](https://edu.b3.com.br/w/fii-tijolo) como fatores a ocupação, a qualidade dos inquilinos, a localização e o prazo dos contratos. Riscos: imóvel vazio, inquilino que não paga, renegociação e preço da cota **[Oficial]**.

- **Segmentos se comportam de formas diferentes [Mercado]:** galpões logísticos, lajes de escritório, shoppings (receita ligada às vendas das lojas) e renda urbana (varejo, agências, hospitais, muitas vezes com um único inquilino).
- **Monoativo ou multiativo:** com um só imóvel ou um só inquilino, sair um locatário pode zerar a renda.
- **Contrato típico e atípico [Mercado]:** o típico segue a regra geral da Lei do Inquilinato, e o inquilino costuma poder sair pagando multa. O atípico, como o *built to suit*, é feito sob medida, em geral com prazo longo e multa alta. Dá mais previsibilidade, mas concentra o risco naquele inquilino. As páginas da B3 lidas não trazem essa distinção.

**FII de papel.** Tem títulos de dívida ligados a imóveis, sobretudo CRI, e [vive de juros](https://borainvestir.b3.com.br/glossario/fundo-de-papel/) **[Oficial]**. Riscos: crédito (principal), juros e liquidez dos títulos.

- **Frase que o site deve repetir:** quem compra FII de papel empresta dinheiro, indiretamente, a quem tomou aquele crédito.
- **Indexador:** a carteira pode seguir CDI ou IPCA. Com CDI, o rendimento acompanha os juros. Com IPCA, o fundo pode pagar parte do ganho como correção **[Mercado]**.
- **High grade e high yield [Mercado]:** não há corte oficial. High grade é crédito de devedor forte, com juros menores. High yield é devedor mais arriscado, com juros maiores. A B3 aponta inadimplência em [high yield como principal perigo em 2026](https://borainvestir.b3.com.br/tipos-de-investimentos/renda-variavel/fundos-investimento/fiis-em-2026-e-hora-de-focar-em-renda-ou-ganho-de-capital/) **[Oficial]**.
- **Termos do crédito [Mercado]:**
  - *Spread:* quanto o título paga acima do indexador. Spread alto é pagamento por risco, não presente.
  - *LTV:* dívida dividida pelo valor do imóvel em garantia. Quanto menor, mais folga.
  - *Subordinação:* cotas ou séries que absorvem perdas antes das demais.
  - *Garantias:* alienação fiduciária, cessão de recebíveis, aval.
  - *Pulverizado ou concentrado:* muitos devedores pequenos ou poucos grandes.

**Fundo de fundos (FoF).** Compra cotas de outros FIIs **[Norma: Anexo III, art. 40, VI]**. Dá diversificação, com camada extra de taxas. Quando o FoF vende cotas com lucro, esse ganho é tributado no fundo. Um [resumo cita decisão do STJ](https://amdjus.com.br/stj-define-que-fii-paga-ir-ao-vender-cotas-de-outro-fundo/) nesse sentido **[A verificar]**.

**FII de desenvolvimento.** Constrói para vender ou para alugar. O resultado depende de obra, prazo e vendas, e a renda pode ser irregular. Na norma, o administrador tem de controlar efetivamente o projeto (Anexo III, art. 40, § 1º) **[Norma]**. A CVM publica o avanço da obra por imóvel **[Dado]**.

**Híbrido.** Mistura tipos e [herda os riscos de cada parte](https://edu.b3.com.br/w/fii-hibrido) **[Oficial]**.

**Fiagro.** É o equivalente para o agronegócio e tem a mesma isenção condicionada dos FIIs **[Norma: Lei 11.033, art. 3º, III]**.

### 3.4 Indicadores

Fórmulas clássicas. A definição de P/VP, DY e vacância não vem de norma **[Mercado]**. "Dado CVM" indica o que testei na seção 10.

| Indicador | Conta | O que quer dizer | Armadilha | Dado CVM |
|---|---|---|---|---|
| **P/VP** | Preço da cota ÷ valor patrimonial da cota | Quanto se paga por R$ 1 de patrimônio contábil | Abaixo de 1 não prova barato. O imóvel pode valer menos que o laudo, ou o crédito pode estar ruim. Em papel, P/VP alto ou baixo tem outro peso | Valor patrimonial, sim; preço vem do job atual |
| **Dividend yield (DY)** | Rendimentos de 12 meses ÷ preço atual | Quanto foi pago, em relação ao preço de hoje | Olha o passado. Sobe quando o preço cai. Pode incluir venda de ativo. Em papel, parte pode ser correção por inflação | Campo mensal existe, com ressalvas |
| **Rendimento por cota** | R$ pagos por cota no mês | O que caiu na conta | Comparar entre fundos não diz nada; o preço da cota é diferente | Não testei; precisa de outra fonte ou cálculo |
| **Vacância física** | Área vazia ÷ área total | Quanto do imóvel está sem inquilino | Metro quadrado não é receita igual em todo lugar | Por imóvel |
| **Vacância financeira** | Aluguel potencial perdido ÷ aluguel potencial | Quanto de receita a vacância leva | Depende de como o fundo calcula; descontos e carências mudam | Só em relatório gerencial |
| **Inadimplência** | Valores vencidos ÷ valores devidos | Quem está alugado, mas não paga | Conceitos variam | Por imóvel |
| **WAULT** | Prazo restante dos contratos, ponderado pela receita | [Previsibilidade da receita](https://edu.b3.com.br/w/fii-tijolo) | Não vem pronto. Dá para aproximar com as faixas de vencimento | Faixas de vencimento |
| **Cap rate** | Renda anual do imóvel ÷ valor do imóvel | Rendimento do imóvel, como um DY do imóvel | Muda com o valor adotado | Não |
| **Concentração** | Parte da receita por imóvel ou inquilino | Quanto dói perder um | | Sim, por imóvel e setor do inquilino |
| **Taxas** | Administração, gestão, performance | Custo que sai do retorno | Comparar bases iguais | Parcial |
| **Liquidez diária** | Valor negociado por dia | Facilidade de sair sem mexer no preço | Não garante saída em crise | Precisa de volume; o job não traz |

**Regras firmes para o site:**
- Nenhum corte universal, como "P/VP abaixo de 1 é barato" ou "DY acima de 10% é bom". Nenhuma fonte primária sustenta isso.
- DY sempre com período, e sempre explicado como passado.
- Tijolo e papel não se comparam pelos mesmos indicadores. Vacância não existe em papel; LTV não existe em tijolo.
- Rendimento e amortização são coisas diferentes. Na amortização, o fundo [devolve parte do valor da cota](https://conteudo.cvm.gov.br/export/sites/cvm/legislacao/resolucoes/anexos/100/resol175consolid.pdf), sem reduzir o número de cotas **[Norma]**.

### 3.5 Emissões

Um fundo pode lançar novas cotas para comprar ativos. Se a pessoa não exercer o direito de preferência, sua fatia diminui (diluição). O direito depende do regulamento e da oferta. Isso vem de [um prospecto](https://web.cvm.gov.br/sre-publico-cvm/rest/download/2a4a7115-9225-4d47-8cf4-e0e199dfca59), não de regra geral **[A verificar: regra geral]**.

A B3 aponta [riscos de emissão em fundos de tijolo](https://borainvestir.b3.com.br/tipos-de-investimentos/renda-variavel/fundos-investimento/fundos-imobiliarios-quando-vale-a-pena-entrar-em-uma-nova-emissao-de-cotas/): compra travada, diligência demorada e demora para encontrar inquilino **[Oficial]**.

### 3.6 Imposto sobre FII

Rendimento mensal é isento para pessoa física, sob condições ([Lei 11.033, art. 3º](https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm), com redação da [Lei 14.754](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14754.htm)) **[Norma]**. Todas valem:

- Cotas negociadas exclusivamente em bolsa ou balcão organizado.
- No mínimo 100 cotistas.
- A pessoa não tem 10% ou mais das cotas nem direito a mais de 10% dos rendimentos.
- O conjunto de pessoas físicas ligadas não tem 30% ou mais.

Lucro na venda da cota paga 20%, para qualquer beneficiário ([Lei 9.779, art. 18](https://www.planalto.gov.br/ccivil_03/leis/l9779.htm)) **[Norma]**. A isenção de R$ 20 mil do art. 3º, I, da Lei 11.033 cita ações e ouro, não cotas de FII **[Norma]**. Um dos sites pesquisados afirma o contrário e está errado.

**MP 1.303/2025:** propunha 5% sobre rendimentos de novas cotas. Perdeu vigência, e o Planalto marca o trecho como "Vigência encerrada" **[Norma]**. A área econômica [voltou a defender](https://www.brasilemfolhas.com.br/2026/09/governo-defende-tributacao-de-lcis-e-lcas-para-reduzir-custos-da-divida/) em setembro de 2026 tributar títulos isentos, ainda sem proposta formal **[A verificar; situação instável]**.

### 3.7 IFIX

- [Indicador de retorno total](https://www.b3.com.br/data/files/2A/56/E3/DD/A3943710DB551337AC094EA8/IFIX-Metodologia-pt-br.pdf) dos FIIs listados: conta cotação e rendimentos **[Oficial]**.
- Peso pelo valor de mercado das cotas, com teto de 20% por fundo.
- Revisado a cada quatro meses, segundo fontes secundárias. O PDF lido é de 2020; confirmar a versão atual **[A verificar]**.
- É a régua natural dos FIIs no site. Comparar FII com Ibovespa não ajuda muito.

## 4. Renda fixa

### 4.1 Selic, CDI e IPCA

- **Selic:** juros básicos, definidos pelo Copom. Em [4/11/2026 ficou em 13,75% ao ano](https://borainvestir.b3.com.br/noticias/copom-interrompe-cortes-e-mantem-taxa-selic-em-1375-ao-ano/) **[Oficial, via B3; a página do Banco Central não abriu para leitura automática]**. O site já lê a série do Banco Central, e deve usar o dado e não este texto.
- **CDI:** taxa de empréstimos entre bancos, muito próxima da Selic, usada como régua da renda fixa **[Mercado; definição oficial não lida]**.
- **IPCA:** inflação oficial, medida pelo IBGE.
- **Juro real:** retorno acima da inflação. Render 12% com inflação de 5% é ganhar cerca de 6,7%, porque (1,12 ÷ 1,05) − 1 = 6,67%.

### 4.2 Tesouro Direto

| Título | Rende | Comportamento |
|---|---|---|
| Tesouro Selic | Selic | Oscila pouco |
| Tesouro Prefixado | Taxa fixa | Oscila conforme os juros de mercado |
| Tesouro IPCA+ | IPCA + taxa | Oscila, e bastante nos prazos longos |
| Tesouro IPCA+ com juros semestrais | IPCA + taxa, com cupons | Antecipa imposto a cada cupom |
| Tesouro Renda+ | IPCA + taxa, pago em 20 anos de renda | Foco em aposentadoria |
| Tesouro Educa+ | IPCA + taxa, pago em 5 anos | Foco em educação |
| Tesouro Reserva | Selic | Sem marcação a mercado; resgate 24×7 |

- **Marcação a mercado:** [todos os títulos do Tesouro Direto são marcados a mercado](https://www.b3.com.br/pt_br/produtos-e-servicos/tesouro-direto/tesouro-direto/perguntas-frequentes/), e a venda antecipada é pelo valor do dia, então o retorno pode diferir do contratado **[Oficial]**. A exceção anunciada é o [Tesouro Reserva](https://borainvestir.b3.com.br/tipos-de-investimentos/renda-fixa/tesouro-direto/tesouro-reserva-conheca-o-novo-titulo-do-tesouro-direto-com-operacao-24x7/), lançado em 11/5/2026, com mínimo de R$ 1 e limite de R$ 500 mil por mês, inicialmente pelo Banco do Brasil **[Oficial]**.
- **Exemplo de marcação:** um título sem cupom que paga R$ 1.000 em 10 anos custa R$ 294,59 a 13% ao ano. Se os juros subirem para 14%, passa a valer R$ 269,74, queda de 8,4%. Exemplo hipotético, calculado aqui.
- **Por quê:** quanto mais longo o título, mais o preço reage aos juros. A medida disso é a [duration](https://cfainstitute.org/insights/professional-learning/refresher-readings/2024/interest-rate-risk-and-return): em título sem cupom, a de Macaulay é igual ao prazo **[Oficial, CFA Institute]**.
- **Custódia:** [0,20% ao ano](https://www.b3.com.br/pt_br/produtos-e-servicos/tarifas/tarifas-de-tesouro-direto/), com isenção no Tesouro Selic até R$ 10 mil por CPF **[Oficial]**. Renda+ e Educa+ têm regra própria. Isentos até 6 e 4 salários mínimos de recebimento, e 0,10% sobre o excesso, no recebimento programado **[Oficial]**. A taxa em resgate antecipado diverge entre páginas da B3 **[A verificar]**. Também diverge a forma de cobrança: uma página da B3 fala em semestral, e [outra informa](https://borainvestir.b3.com.br/tipos-de-investimentos/renda-fixa/tesouro-direto/taxa-de-custodia-do-tesouro-direto-de-janeiro-esta-cancelada-veja-como-fica-a-cobranca-agora/) a cobrança no evento **[A verificar]**.

### 4.3 Títulos privados

- **CDB:** dívida de banco, coberta pelo FGC. Liquidez e taxa dependem do título.
- **LCI e LCA:** isentas para pessoa física (Lei 11.033, art. 3º, II e IV) **[Norma]**. O prazo mínimo mudou várias vezes. Pela [Resolução CMN 5.215](https://www.irib.org.br/resolucao-cmn-n-5-215-de-22-de-maio-de-2025/), de maio de 2025, é de 6 meses, e títulos ligados ao IPCA têm prazo maior: 36 meses na LCI e 12 na LCA **[Oficial, via secundários; datas de vigência divergem. A verificar]**.
- **CRI e CRA:** recebíveis securitizados e isentos para pessoa física **[Norma]**. Sem FGC. O risco é o do devedor e das garantias.
- **Debêntures comuns:** dívida de empresa, com tabela regressiva. Sem FGC.
- **Debêntures incentivadas:** projetos prioritários de infraestrutura, com alíquota zero para pessoa física ([Lei 12.431, art. 2º](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12431.htm)) **[Norma]**.
- **Comparar isento com tributado:** uma LCI a 12% equivale a um CDB que pague 12% ÷ (1 − alíquota). Com 15% de imposto, são 14,12%. Essa conta é mais útil que a palavra "isento".

### 4.4 FGC

Até [R$ 250 mil por CPF, por instituição ou conglomerado](https://fgc.org.br/documents/d/guest/material-para-corretoras_versao-dezembro2025), com teto de R$ 1 milhão a cada quatro anos **[Oficial]**. Cobre CDB, RDB, LCI, LCA, LCD, LC, LH, poupança e conta. O limite [inclui rendimentos](https://www.nordinvestimentos.com.br/blog/fgc/) **[Mercado]**. Instrumentos com subordinação ficam de fora **[Oficial]**.

### 4.5 Tabela regressiva

[Lei 11.033, art. 1º](https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm) **[Norma]**: 22,5% até 180 dias; 20% até 360; 17,5% até 720; 15% acima disso. O IOF só atinge resgates em menos de 30 dias, com alíquota decrescente **[Oficial/Mercado; decreto não lido]**.

## 5. Renda variável

### 5.1 Ações

**Conceitos:** ON (voto) e PN (preferência em proventos), free float, liquidez, governança.

**Proventos:**
- **Dividendos:** desde 2026, ficam sujeitos a 10% na fonte quando uma mesma empresa paga mais de R$ 50 mil no mês à mesma pessoa, sobre o total ([Lei 15.270, art. 6º-A](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15270.htm)) **[Norma]**. Resultados até 2025, aprovados até 31/12/2025, ficam fora. Abaixo de R$ 50 mil por mês e por empresa, não há retenção. Rendas totais acima de R$ 600 mil por ano entram em um imposto mínimo, de até 10% a partir de R$ 1,2 milhão **[Norma]**.
- **JCP:** alíquota de 17,5% na fonte ([LC 224/2025, que altera a Lei 9.249](https://www.planalto.gov.br/ccivil_03/leis/lcp/Lcp224.htm)) **[Norma]**. Muitos textos ainda citam 15%.

**Venda:** lucro paga 15%, ou 20% em day trade. Vendas de ações à vista até R$ 20 mil no mês ficam isentas (Lei 11.033, art. 3º, I) **[Norma para a isenção; alíquotas por secundários]**. O limite é sobre o total vendido, não sobre o lucro **[Norma]**. Prejuízo só compensa ganho da mesma natureza **[Mercado; IN 1.585 não lida]**.

**Indicadores** **[Mercado; definições consolidadas, conferidas em fontes secundárias]**:

| Indicador | Conta | Pergunta que responde | Armadilha |
|---|---|---|---|
| P/L | Preço ÷ lucro por ação | Quantos anos de lucro atual o preço representa | Lucro pontual distorce; não vale com prejuízo |
| P/VP | Preço ÷ patrimônio por ação | Preço contra patrimônio contábil | Pouco útil em empresa de ativos intangíveis |
| EV/EBITDA | (Valor de mercado + dívida líquida) ÷ EBITDA | Preço da operação, com a dívida | Não serve para bancos |
| ROE | Lucro ÷ patrimônio | Retorno sobre o capital do sócio | Dívida alta infla |
| ROIC | Lucro operacional após impostos ÷ capital investido | Retorno sobre todo o capital | Cálculos variam |
| Dívida líquida/EBITDA | Dívida líquida ÷ EBITDA | Peso da dívida | Faixas variam por setor |
| Margem líquida | Lucro ÷ receita | Quanto sobra das vendas | Só compara dentro do setor |
| Payout | Dividendos ÷ lucro | Parte do lucro distribuída | Acima de 100% pode não durar |
| Dividend yield | Proventos de 12 meses ÷ preço | Pagamento em relação ao preço | Mesma armadilha dos FIIs |

Sem cortes universais. Comparar só dentro do setor. Para múltiplos setoriais, a referência é a [base de Damodaran](https://pages.stern.nyu.edu/~adamodar/) **[Estudo; página de dados não lida]**.

### 5.2 ETF

- Cota de fundo que segue um índice.
- ETF de ações: quando cumpre os requisitos, entra no regime da [Lei 14.754, art. 18](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14754.htm), a 15% **[Norma]**. Sem isenção de R$ 20 mil na venda, [segundo a Receita](https://www.contabeis.com.br/noticias/7530/receita-esclarece-regras-para-tributacao-dos-etfs/) **[Oficial, via secundário]**.
- ETF de renda fixa: alíquota pelo prazo médio da carteira, de 25%, 20% ou 15% ([Lei 13.043](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13043.htm)) **[Norma]**. O tempo em que a pessoa fica com a cota não muda a alíquota.
- ETF de FII: a [Bora Investir fala em 20%](https://borainvestir.b3.com.br/?p=45479) para índices brasileiros, e a [B3 Educação cita tabela regressiva](https://edu.b3.com.br/w/etf-fii). As duas são da B3 e se contradizem **[A verificar]**.

### 5.3 BDR

Recibo de ação estrangeira negociado na B3. Sem isenção de R$ 20 mil, [segundo a B3](https://borainvestir.b3.com.br/tipos-de-investimentos/renda-variavel/etfs/tributacao-etf-e-bdr/), com 15% ou 20% **[Oficial]**. O imposto sobre proventos varia entre fontes **[A verificar]**. O retorno mistura empresa e câmbio.

## 6. Fundos e previdência

- **Come-cotas:** fundos abertos de renda fixa e multimercado retêm imposto no último dia útil de maio e de novembro: 15% nos gerais, 20% nos de curto prazo, com ajuste na saída pela tabela regressiva (Lei 14.754, art. 17) **[Norma]**. A mesma lei alcançou fundos fechados, com a exceção de FII, Fiagro e outros regimes próprios (art. 39) **[Norma]**.
- **Fundos de ações, FIP, FIDC e ETF elegíveis:** 15%, sem come-cotas, se cumprirem requisitos (art. 18) **[Norma]**.
- **FIDC:** carteira de direitos creditórios, de no mínimo 67% (art. 19) **[Norma]**. Pode ter cotas subordinadas e sênior. Risco de crédito.
- **Previdência, PGBL e VGBL:** a tabela regressiva vai de 35% (até 2 anos) a 10% (acima de 10 anos) ([Lei 11.053, art. 1º](https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11053.htm)) **[Norma]**. Pela [Lei 14.803](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/L14803.htm), a escolha entre regressiva e progressiva pode ser feita até o primeiro benefício ou resgate **[Norma]**. Dedução do PGBL até 12% da renda e tributação do VGBL só sobre o ganho: conhecimento consolidado, não conferido na norma **[A verificar]**.

## 7. Risco e evidências

### Medidas

| Medida | O que mede | Limite |
|---|---|---|
| Volatilidade | Tamanho das oscilações | Trata alta e queda igualmente |
| Maior queda | Pior perda do pico ao fundo | Depende do período |
| [Sharpe](https://web.stanford.edu/~wfsharpe/art/sr/sr.htm) | Retorno acima da referência, por unidade de risco | Difícil de ler se negativo; o autor pede referência adequada, e aqui é o CDI |
| Sortino | Como Sharpe, só com oscilação para baixo | Fontes secundárias; depende do retorno mínimo escolhido |
| Beta | Sensibilidade ao índice | Muda com o tempo |
| Correlação | Se dois ativos andam juntos | Costuma subir em crises |
| Duration | Reação do preço de título aos juros | Aproximação para pequenas variações |

O site já calcula volatilidade, maior queda, Sharpe e correlação.

### O que os estudos mostram

- **Poucas ações geram a maior parte do ganho.** Nos EUA, [42,6% das ações superaram T-bills](https://www.morningstar.com/personal-finance/hendrik-bessembinder-do-stocks-outperform-treasury-bills) ao longo da vida, e o resultado mais comum é perder tudo. [Fora dos EUA](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3415739), 61% ficaram abaixo **[Estudo; lido por resumos]**. É o argumento mais forte a favor de diversificar. Não há estudo equivalente para o Brasil nesta pesquisa.
- **Negociar muito custa caro.** Entre 66.465 famílias de 1991 a 1996, as que mais negociaram [renderam 11,4% ao ano contra 17,9% do mercado](https://econpapers.repec.org/RePEc:bla:jfinan:v:55:y:2000:i:2:p:773-806) **[Estudo; resumo]**.
- **Day trade no Brasil.** [Entre quem persistiu por mais de 300 dias, 97% perderam dinheiro](https://repositorio.fgv.br/items/e87d04fc-4b4c-4a56-ab5a-1c84c1afde1b/full), e 1,1% ganhou mais que o salário mínimo. Dados de minicontratos de 2013 a 2015 **[Estudo; resumo, e período específico]**.
- **Fundos ativos contra índices.** No [SPIVA Latin America](https://www.spglobal.com/spdji/en/spiva/article/spiva-latin-america/), em 2025, ficaram abaixo do índice 35,6% dos fundos brasileiros large cap, 58% dos mid/small e 50% de ações Brasil. O relatório informa que todas as categorias ficaram abaixo em 10 anos **[Estudo; vi por resumos, porque o site bloqueou a leitura das tabelas, e não tenho os percentuais de 10 anos]**. O índice usado é da S&P, não o Ibovespa. Um único ano, como 2025, diz pouco.
- **Passado não é promessa.** A CVM repete que [desempenho passado não garante futuro](https://www.gov.br/investidor/pt-br/educacional/publicacoes-educacionais/guias/guia-de-fundos-de-investimento-imobiliarios.pdf/@@download/file/Guia%20de%20Fundos%20de%20Investimento%20Imobili%C3%A1rios.pdf) **[Oficial]**.

Modelos clássicos, como Markowitz e Fama-French, são da literatura e não foram relidos nesta pesquisa. Usar só como pano de fundo até conferir.

## 8. Resumo de imposto para pessoa física

Vigente em 2026-11-04, conforme as seções acima. Reconferir antes de publicar.

| Ativo | Rendimento | Venda com lucro | Isenção na venda de até R$ 20 mil no mês |
|---|---|---|---|
| Tesouro, CDB, debênture comum | Tabela regressiva | Tabela regressiva | Não |
| LCI, LCA, CRI, CRA | Isento | Regra específica; confirmar | Não |
| Debênture incentivada | Alíquota zero | Alíquota zero | Não se aplica |
| Ação | Dividendos, salvo regra de R$ 50 mil; JCP 17,5% | 15%; day trade 20% | Sim |
| FII | Isento, sob condições | 20% | Não |
| ETF de ações | Conforme o caso | 15% | Não |
| ETF de renda fixa | Conforme o prazo da carteira | 25%, 20% ou 15% | Não |
| BDR | A verificar | 15%; day trade 20% | Não |

## 9. Limites regulatórios para o site

**Não é parecer jurídico. Convém ouvir um advogado antes de ampliar análises por ativo.**

- **Analista:** a [Resolução CVM 20, art. 1º](https://conteudo.cvm.gov.br/export/sites/cvm/legislacao/resolucoes/anexos/001/resol020consolid.pdf), alcança quem, **em caráter profissional**, publica relatórios de análise. O § 1º define relatório como textos ou estudos sobre valores mobiliários específicos que possam auxiliar ou influenciar decisões **[Norma]**. A definição é ampla. O site é educativo e não comercial, o que pesa, mas não encontrei regra que isente por isso.
- **Educação:** o artigo que trata de educação cuida de atividades do próprio analista, sem recomendação **[Norma]**. Não é uma isenção geral para sites.
- **Influenciadores:** a ANBIMA diz que [analisar ativos em redes](https://www.anbima.com.br/pt_br/especial/manual-melhores-praticas-finfluencers.htm) exige credenciamento, e que o benefício obtido é um sinal **[Oficial]**. Em [contribuição à CVM](https://conteudo.cvm.gov.br/export/sites/cvm/audiencias_publicas/ap_sdm/anexos/2023/sdm0423_ANBIMA.pdf), afirma que ensinar conceitos sem recomendar fica fora da regulação, e levanta a monetização como ponto de atenção **[Oficial; posição de entidade, não da CVM]**.
- **Perfil do cliente:** a [Resolução CVM 30](https://conteudo.cvm.gov.br/export/sites/cvm/legislacao/resolucoes/anexos/001/resol030consolid.pdf) obriga distribuidores e consultores a verificar a adequação ao recomendar **[Norma]**. O questionário do site não pode virar sugestão de produto. A Resolução 19, de consultores, não foi lida **[A verificar]**.

**Linha de cuidado proposta para o produto:**

| Pode | Não pode |
|---|---|
| Explicar conceitos e mostrar dados públicos com data | "Melhor FII", "vale a pena", "compre", "barato" |
| Descrever o que já aconteceu | Prever preço ou rendimento |
| Mostrar a composição real de um fundo | Ranking por atratividade |
| Listar riscos do tipo de ativo | Sugerir ativo a partir do perfil |
| Comparar com CDI e índices | Selo, nota ou "semáforo" de compra |

Isso vale também para o assistente de IA da fase 6, que é o ponto de maior risco. Ele não deve responder "qual comprar".

## 10. Dados abertos da CVM: teste real

Baixei [`inf_mensal_fii_2026.zip`](https://dados.cvm.gov.br/dataset/fii-doc-inf_mensal) e [`inf_trimestral_fii_2026.zip`](https://dados.cvm.gov.br/dataset/fii-doc-inf_trimestral). Os arquivos têm separador `;` e codificação Latin-1, e cada fundo é identificado por CNPJ. **[Dado]**

**Atualidade:** mensal até setembro de 2026, com 1.374 fundos no último mês. Trimestral até 30/9/2026, mas os fundos testados ainda estavam em 30/6/2026. Os informes chegam com atraso, e a tela precisa mostrar a data de referência.

**Ligação com o catálogo:** o campo `Codigo_ISIN` segue o padrão `BR` + quatro letras do ticker + `CTF...` nos cinco fundos testados, como `BRHGLGCTF004`. Serve de chave para ligar ao catálogo. Tem 1.178 ISINs, então fundos não listados precisam ser filtrados.

**Composição, setembro de 2026** (parcela de `Total_Investido`):

| Fundo | Imóveis | CRI | Cotas de FII | Segmento na CVM | Leitura de mercado |
|---|---:|---:|---:|---|---|
| HGLG11 | 85% | 0% | 2% | Multicategoria | Tijolo |
| KNCR11 | 0% | 84% | 9% | Multicategoria | Papel |
| MXRF11 | 6% | 75% | 14% | **Logística** | Papel |
| XPML11 | 64% | 2% | 29% | Shoppings | Tijolo, com parte via outros FIIs |
| HFOF11 | 0% | 0% | 100% | Multicategoria | Fundo de fundos |

A composição acerta os cinco, com a ressalva do XPML11. O segmento erra em pelo menos um. Foi um teste pequeno, de cinco fundos escolhidos por mim.

**Regra proposta, a validar em mais fundos:**
1. Calcular os percentuais sobre `Total_Investido`. Papel soma `CRI`, `CRI_CRA`, `LCI`, `LCI_LCA`, `Letras_Hipotecarias` e `LIG`. Tijolo soma `Direitos_Bens_Imoveis`. Fundo de fundos usa `FII`. Desenvolvimento usa os campos `Imoveis_*_Construcao` e `Imoveis_Venda_*`.
2. A partir de 2/3 em um grupo, usar esse rótulo. É o corte da ANBIMA, aplicado à carteira real.
3. Abaixo disso, mostrar "misto", com as partes. Por essa regra o XPML11 seria misto, com 64% em imóveis. Para corrigir esses casos, usar uma lista revisada à mão, e não baixar o corte sem testar.
4. Sempre mostrar a barra de composição e a data, para o rótulo nunca esconder o dado. Explicar que o rótulo é calculado pelo site.

**O que dá para mostrar, com o campo:**

| Assunto | Arquivo e campos | Ressalva encontrada |
|---|---|---|
| Valor patrimonial e P/VP | Mensal, `complemento`: `Valor_Patrimonial_Cotas` | Preço vem do job atual |
| Cotistas | Mensal, `complemento`: `Total_Numero_Cotistas` e por tipo | Permite conferir a condição de 100 cotistas |
| Yield do mês | `Percentual_Dividend_Yield_Mes` | XPML11 veio negativo em 9/2026 (−0,11%). Validar antes de exibir; preferir calcular |
| Amortização | `Percentual_Amortizacao_Cotas_Mes` | Não testado |
| Taxa de administração | `Percentual_Despesas_Taxa_Administracao` | Não testado |
| Vacância e inadimplência | Trimestral, `imovel`: `Percentual_Vacancia`, `Percentual_Inadimplencia`, `Percentual_Receitas_FII` | HGLG11 tem 37 imóveis, e XPML11, 17. Ponderar pela receita ou área. Valores em fração |
| Vencimento dos contratos | Trimestral, `complemento`: `Percentual_Vencimento_Receita_FII_Faixa_*` | HGLG11: 58% da receita acima de 36 meses, 12% em até 3. **XPML11 veio todo em zero**: tratar zero como não informado |
| Inquilinos | Trimestral, `imovel_renda_acabado_inquilino`: `Setor_Atuacao`, `Percentual_Receitas_FII` | Mostra concentração por setor, sem nome de inquilino |
| Obras | Trimestral, `imovel`: conclusão realizada e prevista | Para fundos de desenvolvimento |

**Campos que não servem:** `Mandato` veio vazio em todos os registros de 2026. `Tipo_Gestao` usa "Ativa" e "Definida", e não "Passiva". `Segmento_Atuacao` veio como "Multicategoria" em 662 de 1.374 fundos.

**O que os dados não têm:** carteira de crédito detalhada com spread, LTV e garantias; cap rate; vacância financeira padronizada. Isso fica em relatórios gerenciais em PDF. Extrair com LLM seria outra frente, com risco de erro. Por ora, fora de escopo.

**Outras fontes a testar:** demonstrações de companhias abertas (DFP e ITR) na mesma plataforma, para indicadores de ações; informes de securitizadoras para CRI e CRA.

## 11. Como aplicar no sistema

Propostas para decidir depois. Nenhuma foi aprovada.

### 11.1 Em ordem de valor e custo

1. **Glossário** (só texto, sem risco de dados). Acrescentar os verbetes abaixo.
2. **Bloco "O que este fundo tem" na página do FII:** barra de composição, rótulo e data. O job noturno ganha a leitura do informe mensal da CVM. Tela nova não é necessária.
3. **Riscos por tipo:** texto fixo conforme o rótulo. Tijolo fala de vacância; papel, de crédito.
4. **Vacância e vencimento de contratos** para tijolo, com data e tratamento de dado ausente.
5. **P/VP e DY de 12 meses**, sempre com a frase que explica o que eles não dizem.
6. **Comparação com IFIX** na página do FII.
7. **Indicadores de ações**, depois de testar a qualidade dos dados da CVM.
8. **Conta "isento contra tributado"** na simulação da fase 5.

### 11.2 Teste de imagens

Pela regra do autor, entram só imagens que mudam o entendimento:

| Candidata | Passa? | Por quê |
|---|---|---|
| Barra de composição do fundo | Sim | É o próprio dado |
| Diagrama "para onde vai o dinheiro em tijolo e em papel" | Provável | Explica estrutura. Palavras e imagem relevante ajudam quem está aprendendo, e não pode ser enfeite |
| Linha do tempo da marcação a mercado | Provável | Mostra algo difícil de explicar só com texto |
| Foto de prédio ou galpão genérico | Não | Decoração; também sugere que aquele imóvel é do fundo |
| Logos de empresas ou fundos | Não | Ajuda pouco e traz risco de marca |

### 11.3 Verbetes prontos para o glossário

Estilo do site: uma ou duas frases, sem jargão. Revisar antes de publicar.

| Verbete | Texto |
|---|---|
| FII de tijolo | Fundo que tem imóveis e recebe aluguel. O rendimento depende de os imóveis estarem ocupados e de os inquilinos pagarem. |
| FII de papel | Fundo que empresta dinheiro ao setor imobiliário por meio de títulos, como CRI. O rendimento vem de juros, e o principal risco é o devedor não pagar. |
| Fundo de fundos | Fundo que compra cotas de outros fundos imobiliários. Diversifica, mas soma as taxas dele às dos outros. |
| FII híbrido | Fundo que mistura imóveis, títulos ou outras cotas, e por isso soma os riscos de cada parte. |
| FII de desenvolvimento | Fundo que constrói imóveis para vender ou alugar. O resultado depende da obra e das vendas, e a renda pode ser irregular. |
| Cota | A parte do fundo que você compra. Para sair, é preciso vender a outra pessoa, porque o FII não devolve o dinheiro a pedido. |
| Valor patrimonial da cota | O patrimônio do fundo dividido pelo número de cotas. Depende de avaliações e pode não ser o preço pelo qual os ativos seriam vendidos. |
| P/VP | Preço da cota dividido pelo valor patrimonial. Abaixo de 1, o mercado paga menos que o valor contábil, o que não prova que está barato. |
| Dividend yield | Quanto o ativo pagou em 12 meses, em relação ao preço de hoje. Olha para o passado e sobe quando o preço cai. |
| Rendimento do FII | Dinheiro que o fundo distribui aos cotistas, em geral todo mês. Pode mudar e não é garantido. |
| Amortização | Quando o fundo devolve parte do valor da cota. Não é lucro: você recebe de volta parte do que já era seu. |
| Vacância | Parte dos imóveis que está sem inquilino. Imóvel vazio não paga aluguel. |
| Inadimplência | Quando quem deve não paga no prazo, seja o inquilino de um imóvel, seja o devedor de um título. |
| WAULT | Tempo médio que falta para os contratos de aluguel acabarem, pesando mais os que rendem mais. Quanto maior, mais previsível tende a ser a receita. |
| Contrato atípico | Aluguel feito sob medida, em geral longo e com multa alta para sair. Dá previsibilidade, mas depende muito daquele inquilino. |
| Cap rate | Renda anual de um imóvel dividida pelo seu valor. É o quanto o imóvel rende, sem contar a oscilação do preço da cota. |
| CRI | Título que transforma dívidas ligadas a imóveis em investimento. Não tem garantia do FGC. |
| LTV | Tamanho da dívida em relação ao valor do imóvel dado em garantia. Quanto menor, maior a folga se for preciso vender o imóvel. |
| Spread | Quanto um título paga acima do seu indexador. Em geral, spread maior é pagamento por mais risco. |
| Subordinação | Parte do investimento que absorve as perdas antes das outras. Protege quem está à frente e arrisca mais quem está atrás. |
| High grade | Crédito de devedores mais sólidos, com juros menores. Não há uma regra oficial para o termo. |
| High yield | Crédito de devedores mais arriscados, com juros maiores. Juro alto paga risco, não é ganho garantido. |
| Marcação a mercado | Atualização diária do preço de um título. Quem vende antes do vencimento recebe o preço do dia, que pode ser menor que o pago. |
| Duration | Medida de quanto o preço de um título reage aos juros. Quanto maior, maior o sobe e desce. |
| Come-cotas | Imposto que alguns fundos retêm em maio e novembro, reduzindo a quantidade de cotas. |
| FGC | Fundo privado que devolve até R$ 250 mil por pessoa e por banco, se o banco quebrar. Não cobre Tesouro, CRI, debênture, ações nem FII. |
| IFIX | Índice que acompanha os fundos imobiliários mais negociados, contando cotação e rendimentos. |
| Diluição | Quando o fundo emite cotas novas e sua fatia fica menor, se você não comprar a sua parte. |
| JCP | Juros sobre capital próprio: forma de a empresa pagar acionistas. Tem 17,5% de imposto na fonte. |
| P/L | Preço da ação dividido pelo lucro por ação. Só faz sentido comparado a empresas parecidas. |
| Payout | Parte do lucro que a empresa distribui. Acima de 100%, paga mais do que lucrou, o que pode não durar. |

### 11.4 Regras de linguagem

- Número com período e fonte. Passado no pretérito.
- Em vez de "isento de imposto": "rendimento isento para pessoa física, sob condições".
- FII de papel: nunca "como um imóvel".
- Yield alto: sempre lembrar que pode refletir queda de preço ou maior risco.
- Sem verbos de ação de compra ("aproveite", "garanta").
- Dado ausente aparece como "não informado", nunca como zero.
- Rótulo calculado pelo site é dito como tal.

### 11.5 Prova mínima antes de implementar

- Teste do leitor de dados da CVM com um arquivo pequeno salvo, incluindo Latin-1, zeros e campos vazios.
- Validar a regra de composição em toda a carteira de 30 FIIs do catálogo, comparada à lista revisada à mão, antes de mostrar qualquer rótulo.
- Confirmar o tamanho no banco. O plano gratuito tem 500 MB, e o banco já tinha 61 MB na fase 2. O informe mensal é pequeno, mas o trimestral tem muitas linhas por imóvel.

## 12. O que reconferir antes de publicar

| Fato | Por quê | Fonte para reconferir |
|---|---|---|
| Isenção de LCI, LCA, CRI, CRA, FII, Fiagro | Governo voltou a defender mudança em 2026 | Planalto, Fazenda |
| Dividendos e JCP | Regras novas de 2026; a alíquota do JCP muda de valor em textos antigos | Lei 15.270, LC 224, Receita |
| Prazos mínimos de LCI e LCA | Mudaram em 2024 e 2025 | [Normativos do BCB](https://normativos.bcb.gov.br/Lists/Normativos/Attachments/48547/Res_4410_v7_P.pdf) |
| Anexo III da Resolução 175 | Reforma em consulta | CVM |
| Classificação da ANBIMA | Texto lido é de 2015 | ANBIMA |
| IFIX | PDF lido é de 2020 | B3 |
| Tesouro Reserva e custódia | Produto novo; páginas divergem | Tesouro Direto, B3 |
| Prazos de pagamento do Renda+ (20 anos) e do Educa+ (5 anos) | Citados de memória, sem leitura nesta pesquisa | Tesouro Direto |
| Selic e IPCA | Mudam sempre | Usar a série, nunca texto fixo |
| Limites do FGC | Podem ser revistos | FGC |

## 13. Lacunas desta pesquisa

- **Não lidos na íntegra:** IN RFB 1.585, Decreto 6.306 do IOF, Resolução CVM 19, Lei 14.430 de securitização, e as tabelas do SPIVA (o site bloqueou leitura automática).
- **Sem definição oficial encontrada:** tijolo, papel, high grade, high yield, cap rate e WAULT em fórmula. O uso é consagrado no mercado, e tratei assim.
- **Página do Banco Central sobre a Selic:** não abriu em leitura automática.
- **Teste de dados:** só cinco fundos. Não valida a regra em toda a base.
- **Fontes de mercado:** blogs foram usados só para encontrar pontos a conferir. Onde a norma estava disponível, a norma prevaleceu. Dados de inadimplência de CRI vistos em uma newsletter não foram usados, por não ter a fonte original.
