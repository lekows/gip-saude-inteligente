import type {
  DataFieldDefinition,
  DataSourceCatalogItem
} from "@/types/dataGovernance";

export const dataSourceCatalog: DataSourceCatalogItem[] = [
  source("cnes", "health_units_cnes.csv", "CNES oficial", "Ministerio da Saude", "Estabelecimentos ativos de Luziania-GO com atendimento ambulatorial SUS", "Snapshot oficial", "Recorte minimizado da API de Dados Abertos do Ministerio da Saude, extraido em 12/08/2026.", "official_verified"),
  source("sisab-official", "aps_indicators_sisab_official.csv", "SISAB oficial", "SAPS / Ministerio da Saude", "Indicadores municipais do Previne Brasil para equipes homologadas", "Carga historica 2024Q3", "Base publica oficial, municipal e agregada. Nao possui bairro, unidade ou paciente e nao alimenta diretamente o score territorial.", "official_verified"),
  {
    ...source("ibge-sectors", "luziania_census_sectors_ibge.geojson", "Setores censitarios IBGE", "IBGE", "Malha oficial, populacao, demografia e domicilios agregados dos 348 setores de Luziania", "Censo 2022", "A geografia e os agregados sao oficiais. Os scores de cobertura e vulnerabilidade sao derivados, demonstrativos e nao representam risco clinico.", "official_verified"),
    trustBadges: ["publico_real", "agregado", "fonte_oficial", "validado_tecnicamente", "simulado"]
  },
  {
    ...source("ibge-vulnerability", "census_sector_vulnerability_ibge.csv", "Contexto territorial IBGE", "IBGE", "Faixas etarias e caracteristicas domiciliares agregadas por setor", "Censo 2022", "Valores X permanecem protegidos. Lacunas domiciliares usam somente o minimo publicado e o score do GIP e demonstrativo.", "official_verified"),
    trustBadges: ["publico_real", "agregado", "fonte_oficial", "validado_tecnicamente", "simulado"]
  },
  source("sisab-territorial", "aps_indicators_sisab.csv", "SISAB territorial do MVP", "APS municipal de Luziania", "Indicadores agregados por bairro e unidade", "Mensal", "Seed demonstrativo. A substituicao exige exportacao municipal agregada, dicionario aprovado e evidencia de homologacao.", "institutional_pending_homologation"),
  source("sia", "outpatient_production_sia.csv", "SIA/SUS", "Ministerio da Saude", "Producao ambulatorial agregada", "Mensal", "Substituir o seed por extracao oficial agregada por competencia."),
  source("sih", "hospital_morbidity_sih.csv", "SIH/SUS", "Ministerio da Saude", "Morbidade hospitalar agregada", "Mensal", "Nao utilizar registros de internacao individualizados no painel."),
  source("sim", "mortality_sim.csv", "SIM", "MVP GIP", "Mortalidade demonstrativa agregada", "Simulada", "Arquivo inteiramente simulado; nao apresentar como extracao oficial.", "simulated_only"),
  source("sinan", "notifiable_diseases_sinan.csv", "SINAN", "Vigilancia epidemiologica", "Notificacoes agregadas por territorio", "Mensal", "Exige supressao de contagens pequenas antes de divulgacao publica."),
  source("sisvan", "nutritional_status_sisvan.csv", "SISVAN", "Ministerio da Saude / APS municipal", "Estado nutricional agregado", "Mensal", "Usar faixas agregadas, sem medidas ou identificadores individuais."),
  source("pni", "immunization_pni.csv", "PNI", "Programa Nacional de Imunizacoes", "Cobertura vacinal agregada", "Mensal", "Competencia, denominador e metodo devem acompanhar cada carga."),
  source("ibge-municipality", "luziania_municipality_ibge.geojson", "IBGE oficial", "IBGE", "Limite municipal oficial de Luziania-GO", "Sob demanda", "Malha municipal intermediaria oficial para validar coordenadas e enquadramento territorial.", "official_verified"),
  source("territory-neighborhoods", "luziania_neighborhoods.geojson", "Bairros operacionais do MVP", "Prefeitura de Luziania / coordenacao GIP", "Poligonos demonstrativos por bairro", "Sob revisao", "O IBGE nao fornece esta divisao operacional de bairros. Os poligonos continuam simulados ate homologacao municipal.", "institutional_pending_homologation")
];

export const dataFieldDictionary: DataFieldDefinition[] = [
  field("cnes", "cnes", "Codigo CNES", "texto", true, "publico_agregado", "Identificador publico do estabelecimento.", "Unico e referenciado pelo SISAB.", ["Dashboard", "Mapa"]),
  field("cnes", "name", "Nome da unidade", "texto", true, "publico_agregado", "Nome publico do estabelecimento.", "Nao pode estar vazio.", ["Mapa", "Ranking"]),
  field("cnes", "type", "Tipo da unidade", "texto", true, "publico_agregado", "UBS, CAIS, hospital ou outro.", "Deve pertencer ao dominio autorizado.", ["Mapa", "Filtros"]),
  field("cnes", "ibge_city_code", "Codigo IBGE", "texto", true, "publico_agregado", "Municipio de referencia.", "Obrigatorio 5212501 no escopo atual.", ["Integracao"]),
  field("cnes", "lat", "Latitude da unidade", "decimal", true, "publico_agregado", "Coordenada publica da unidade.", "Entre -90 e 90 e dentro do municipio.", ["Mapa"]),
  field("cnes", "lng", "Longitude da unidade", "decimal", true, "publico_agregado", "Coordenada publica da unidade.", "Entre -180 e 180 e dentro do municipio.", ["Mapa"]),
  field("sisab-official", "indicator_code", "Indicador oficial", "texto", true, "publico_agregado", "Codigo do indicador de desempenho do SISAB.", "Deve existir no dicionario oficial da SAPS.", ["Linha de base municipal"]),
  field("sisab-official", "numerator", "Numerador oficial", "inteiro", true, "publico_agregado", "Numerador municipal agregado do indicador.", "Maior ou igual a zero e sem identificacao individual.", ["Linha de base municipal"]),
  field("sisab-official", "denominator", "Denominador oficial", "inteiro", true, "publico_agregado", "Denominador municipal agregado do indicador.", "Maior ou igual a zero.", ["Linha de base municipal"]),
  field("sisab-official", "team_view", "Visao das equipes", "texto", true, "publico_agregado", "Recorte de equipes usado na publicacao oficial.", "No arquivo ativo deve ser homologadas.", ["Governanca"]),
  field("sisab-territorial", "period", "Competencia", "data", true, "institucional_agregado", "Mes de referencia.", "Formato AAAA-MM e sem competencia futura.", ["Dashboard", "Series"]),
  field("sisab-territorial", "neighborhood_id", "Bairro", "texto", true, "institucional_agregado", "Chave territorial agregada.", "Deve existir no GeoJSON homologado.", ["Mapa", "Ranking"]),
  field("sisab-territorial", "unit_cnes", "Unidade de referencia", "texto", true, "institucional_agregado", "CNES responsavel pelo indicador.", "Deve existir no catalogo CNES ativo.", ["Dashboard"]),
  field("sisab-territorial", "condition", "Condicao prioritaria", "texto", true, "institucional_agregado", "Grupo de condicao monitorada.", "Deve pertencer ao dominio clinico do GIP.", ["Filtros", "Score"]),
  field("sisab-territorial", "target_population", "Populacao-meta", "inteiro", true, "institucional_agregado", "Denominador agregado da meta.", "Inteiro maior ou igual a zero.", ["Cobertura", "Metas"]),
  field("sisab-territorial", "registered_patients", "Pessoas cadastradas", "inteiro", true, "institucional_agregado", "Contagem agregada de cadastros.", "Sem identificacao e maior ou igual a zero.", ["Cobertura"]),
  field("sisab-territorial", "high_risk_patients", "Alto risco agregado", "inteiro", false, "institucional_agregado", "Contagem territorial de alto risco.", "Nao superar cadastrados; suprimir pequenas contagens.", ["Score", "Ranking"]),
  field("sisab-territorial", "early_returns", "Retornos precoces", "inteiro", false, "institucional_agregado", "Contagem agregada de retornos.", "Maior ou igual a zero.", ["Score", "Mutirao IA"]),
  field("sia", "procedure_group", "Grupo de procedimento", "texto", true, "publico_agregado", "Agrupamento ambulatorial.", "Usar dominio documentado.", ["Producao"]),
  field("sia", "quantity", "Quantidade produzida", "inteiro", true, "publico_agregado", "Total agregado no periodo.", "Maior ou igual a zero.", ["Dashboard"]),
  field("sih", "cid_group", "Grupo de morbidade", "texto", true, "publico_agregado", "Grupo agregado de diagnostico.", "Nao expor diagnostico individual.", ["Risco"]),
  field("sih", "admissions", "Internacoes", "inteiro", true, "publico_agregado", "Contagem agregada.", "Suprimir pequenas contagens na area publica.", ["Score"]),
  field("sim", "deaths", "Obitos simulados", "inteiro", true, "simulado", "Contagem ficticia do MVP.", "Campo simulated deve ser verdadeiro.", ["Demonstracao"]),
  field("sim", "simulated", "Marcador de simulacao", "booleano", true, "simulado", "Evita confusao com dado oficial.", "Sempre true no MVP.", ["Qualidade"]),
  field("sinan", "cases", "Casos notificados", "inteiro", true, "institucional_agregado", "Contagem territorial agregada.", "Aplicar supressao de pequenas contagens.", ["Alertas", "Score"]),
  field("sisvan", "assessed_count", "Pessoas avaliadas", "inteiro", true, "publico_agregado", "Denominador nutricional.", "Maior ou igual a obesidade e sobrepeso.", ["Indicadores"]),
  field("sisvan", "obesity_count", "Obesidade agregada", "inteiro", true, "publico_agregado", "Contagem agregada.", "Nao superar pessoas avaliadas.", ["Score"]),
  field("pni", "coverage_percent", "Cobertura vacinal", "decimal", true, "publico_agregado", "Percentual agregado.", "Limite metodologico deve ser documentado.", ["Dashboard"]),
  field("ibge-municipality", "geometry", "Limite municipal", "geometria", true, "publico_agregado", "Poligono oficial do municipio.", "GeoJSON valido, codigo 5212501 e coordenadas no limite oficial.", ["Mapa", "Validacao espacial"]),
  field("ibge-sectors", "sector_code", "Setor censitario", "texto", true, "publico_agregado", "Codigo do setor censitario oficial do Censo 2022.", "Quinze digitos e prefixo municipal 5212501.", ["Mapa", "Integracao"]),
  field("ibge-sectors", "population_2022", "Populacao do setor", "inteiro", true, "publico_agregado", "Populacao agregada do setor no Censo 2022.", "Maior ou igual a zero; soma municipal igual a 209129.", ["Mapa", "Prioridade de cobertura"]),
  field("ibge-sectors", "coverage_priority_score", "Prioridade de cobertura", "inteiro", true, "simulado", "Score derivado de populacao, densidade e distancia da APS.", "Entre 0 e 100 e sempre identificado como demonstrativo.", ["Mapa", "Exploracao territorial"]),
  field("ibge-vulnerability", "children_0_9_percent", "Criancas de 0 a 9 anos", "decimal", false, "publico_agregado", "Percentual agregado de moradores com 0 a 9 anos no setor.", "Nulo quando o IBGE protege alguma faixa necessaria.", ["Mapa", "Contexto territorial"]),
  field("ibge-vulnerability", "older_people_70_plus_percent", "Pessoas com 70 anos ou mais", "decimal", false, "publico_agregado", "Percentual agregado de moradores com 70 anos ou mais no setor.", "Nulo quando o IBGE protege a faixa ou o denominador.", ["Mapa", "Contexto territorial"]),
  field("ibge-vulnerability", "households_non_network_water_min_percent", "Fora da rede geral de agua", "decimal", false, "publico_agregado", "Percentual minimo publicado de domicilios que usam outra forma de abastecimento.", "Valores X sao excluidos da soma e sinalizados como limite inferior.", ["Mapa", "Saneamento"]),
  field("ibge-vulnerability", "households_inadequate_sewage_min_percent", "Destinacao inadequada de esgoto", "decimal", false, "publico_agregado", "Percentual minimo publicado com fossa rudimentar, vala, curso d'agua, outra forma ou sem banheiro.", "Valores X sao excluidos da soma e sinalizados como limite inferior.", ["Mapa", "Saneamento"]),
  field("ibge-vulnerability", "households_uncollected_waste_min_percent", "Lixo sem coleta", "decimal", false, "publico_agregado", "Percentual minimo publicado com lixo queimado, enterrado, descartado em area publica ou outro destino.", "Valores X sao excluidos da soma e sinalizados como limite inferior.", ["Mapa", "Saneamento"]),
  field("ibge-vulnerability", "vulnerability_context_score", "Contexto de vulnerabilidade", "inteiro", false, "simulado", "Score derivado de estrutura etaria, agua, esgoto e lixo.", "Entre 0 e 100; nulo quando faltam variaveis essenciais; nunca classificado como risco clinico.", ["Mapa", "Exploracao territorial"]),
  field("territory-neighborhoods", "id", "Chave do bairro", "texto", true, "institucional_agregado", "Identificador operacional do bairro.", "Unico e aprovado pelo municipio antes do uso real.", ["Integracao", "Score territorial"])
];

function source(
  id: string,
  fileName: string,
  sourceName: string,
  owner: string,
  scope: string,
  frequency: string,
  notes: string,
  status: DataSourceCatalogItem["status"] = "seed_pending_validation"
): DataSourceCatalogItem {
  const trustBadges: DataSourceCatalogItem["trustBadges"] =
    status === "official_verified"
      ? ["publico_real", "agregado", "fonte_oficial", "validado_tecnicamente"]
      : status === "institutional_pending_homologation"
        ? ["agregado", "mvp_seed", "homologacao_pendente"]
        : status === "simulated_only"
          ? ["agregado", "simulado"]
          : ["agregado", "mvp_seed"];

  return {
    id,
    fileName,
    source: sourceName,
    owner,
    scope,
    frequency,
    status,
    trustBadges,
    notes
  };
}

function field(
  sourceId: string,
  fieldName: string,
  label: string,
  type: DataFieldDefinition["type"],
  required: boolean,
  classification: DataFieldDefinition["classification"],
  description: string,
  qualityRule: string,
  usedIn: string[]
): DataFieldDefinition {
  return {
    id: `${sourceId}.${fieldName}`,
    sourceId,
    fieldName,
    label,
    type,
    required,
    classification,
    description,
    qualityRule,
    usedIn
  };
}
