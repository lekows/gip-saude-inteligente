# CNES, IBGE e SISAB oficiais

Atualizado em 14 de agosto de 2026.

## O que esta pronto

- `health_units_cnes.csv`: 58 estabelecimentos ativos de Luziania com atendimento ambulatorial SUS, obtidos da API oficial do Ministerio da Saude. O recorte nao conserva CNPJ, telefone, e-mail ou endereco.
- `luziania_municipality_ibge.geojson`: limite municipal oficial do IBGE, codigo `5212501`, com a estimativa populacional de 2025 registrada como metadado.
- `luziania_census_sectors_ibge.geojson`: 348 setores censitarios oficiais, sendo 315 urbanos e 33 rurais, com populacao, faixas etarias e caracteristicas domiciliares agregadas do Censo 2022.
- `census_sector_vulnerability_ibge.csv`: recorte auditavel das variaveis de criancas, pessoas com 70 anos ou mais, agua, esgoto e lixo usadas no contexto territorial.
- `aps_indicators_sisab_official.csv`: seis indicadores municipais oficiais do terceiro quadrimestre de 2024, na visao de equipes homologadas, sem bairro, unidade ou pessoa.
- `source_provenance.json`: origem, periodo, granularidade, hashes, usos permitidos, bloqueios e situacao de aprovacao de cada camada principal.

## Separacao obrigatoria

O arquivo `aps_indicators_sisab_official.csv` e uma linha de base municipal real e historica. Ele nao pode ser usado para fabricar indicadores por bairro ou por unidade.

O arquivo `aps_indicators_sisab.csv` continua sendo um seed territorial do MVP. Ele so pode ser substituido quando a APS municipal entregar uma exportacao agregada e aprovar formalmente o dicionario, a competencia, os denominadores e a granularidade.

O arquivo `luziania_neighborhoods.geojson` tambem permanece demonstrativo. O IBGE fornece o limite municipal, mas nao homologa automaticamente os bairros operacionais usados pela gestao local.

O arquivo oficial de bairros do Censo 2022 para Goias nao possui bairros de Luziania. Por isso, o GIP usa os setores censitarios oficiais como unidade geografica de evidencia e mantem os bairros do MVP claramente identificados como recortes simulados ate a Prefeitura homologar uma camada operacional.

## Prioridade demonstrativa de cobertura

Cada setor oficial recebeu um score derivado apenas para demonstracao da capacidade analitica do GIP:

- percentil de carga populacional: ate 40 pontos;
- percentil de densidade demografica: ate 30 pontos;
- distancia do centroide ate a UBS ou CAIS mais proxima: ate 30 pontos, com teto em 5 km.

Esse score nao e indicador do IBGE ou do SUS, nao representa risco clinico e nao autoriza uma acao automatica. Ele serve para explorar hipoteses de cobertura que devem ser validadas pela gestao municipal e pelas equipes locais.

Os codigos historicos do SISAB foram revisados: `50` representa vacinacao infantil e `70` representa acompanhamento de diabetes com consulta e hemoglobina glicada. O arquivo analisado nao contem o indicador `60`, referente a hipertensao.

## Contexto demonstrativo de vulnerabilidade

Uma segunda leitura territorial foi mantida separada da pressao de cobertura. Ela usa agregados oficiais do Censo 2022 e calcula:

- proporcao de criancas de 0 a 9 anos: ate 20 pontos, com referencia demonstrativa de 25%;
- proporcao de pessoas com 70 anos ou mais: ate 20 pontos, com referencia de 15%;
- domicilios fora da rede geral de agua: ate 20 pontos;
- destinacao inadequada de esgoto: ate 25 pontos;
- lixo sem coleta: ate 15 pontos, com referencia de 50%.

As referencias de normalizacao e os pesos sao escolhas demonstrativas do GIP, nao pontos de corte do IBGE. A classificacao usa `0-34` menor, `35-69` moderada e `70-100` maior. O resultado descreve contexto demografico e urbano; nao e risco clinico, diagnostico ou predicao individual.

O IBGE publica `X` quando precisa proteger determinados valores. O GIP nao estima esses valores. Para agua, esgoto e lixo, a soma exibida e o minimo efetivamente publicado e recebe o status `published_lower_bound`. Quando a supressao impede calcular denominadores ou faixas etarias, o setor recebe status `insufficient` e fica sem score. Dos 348 setores, 317 possuem score e 31 permanecem sem classificacao.

Variaveis utilizadas no dicionario oficial:

- demografia: `V01006`, `V01031`, `V01032` e `V01041`;
- domicilios permanentes ocupados: `V00001`;
- formas fora da rede geral de agua: `V00112` a `V00118`;
- esgoto inadequado: `V00312` a `V00316`;
- lixo sem coleta: `V00399` a `V00402`.

## Checklist para homologar o SISAB territorial

1. Exportar o relatorio oficial com competencia, municipio, CNES, territorio e contagens agregadas.
2. Remover nome, CPF, CNS, telefone, data de nascimento, endereco e qualquer identificador individual.
3. Preencher o contrato de `data/templates/aps_indicators_sisab_territorial.template.csv`.
4. Validar municipio `5212501`, CNES existentes, periodos, dominios clinicos e consistencia entre numeradores e denominadores.
5. Confirmar que os bairros existem na camada territorial aprovada pela prefeitura.
6. Registrar o papel do aprovador, a data e a evidencia no manifesto de proveniencia.
7. Publicar uma nova versao somente depois de testes e revisao humana.

## Fontes oficiais

- CNES: `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos`
- IBGE Malhas: `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/5212501`
- IBGE Localidades: `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/5212501`
- IBGE Setores Censitarios: `https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_de_setores_censitarios__divisoes_intramunicipais/censo_2022/setores/shp/UF/GO_setores_CD2022.zip`
- IBGE Agregados por Setores: `https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/`
- SISAB Dados Abertos: `https://dadosabertos.saude.gov.br/dataset/indicadores_desempenho_sisab`
- SISAB: `https://sisab.saude.gov.br/`
