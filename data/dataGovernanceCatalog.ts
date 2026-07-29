import type {
  DataFieldDefinition,
  DataSourceCatalogItem
} from "@/types/dataGovernance";

export const dataSourceCatalog: DataSourceCatalogItem[] = [
  source("cnes", "health_units_cnes.csv", "CNES", "Ministerio da Saude / gestor CNES", "Estabelecimentos de saude de Luziania-GO", "Mensal", "Seed demonstrativo; extracao oficial e competencia ainda precisam ser homologadas."),
  source("sisab", "aps_indicators_sisab.csv", "SISAB", "Ministerio da Saude / APS municipal", "Indicadores agregados da atencao primaria", "Mensal", "Somente indicadores agregados; colunas individuais sao bloqueadas."),
  source("sia", "outpatient_production_sia.csv", "SIA/SUS", "Ministerio da Saude", "Producao ambulatorial agregada", "Mensal", "Substituir o seed por extracao oficial agregada por competencia."),
  source("sih", "hospital_morbidity_sih.csv", "SIH/SUS", "Ministerio da Saude", "Morbidade hospitalar agregada", "Mensal", "Nao utilizar registros de internacao individualizados no painel."),
  source("sim", "mortality_sim.csv", "SIM", "MVP GIP", "Mortalidade demonstrativa agregada", "Simulada", "Arquivo inteiramente simulado; nao apresentar como extracao oficial.", "simulated_only"),
  source("sinan", "notifiable_diseases_sinan.csv", "SINAN", "Vigilancia epidemiologica", "Notificacoes agregadas por territorio", "Mensal", "Exige supressao de contagens pequenas antes de divulgacao publica."),
  source("sisvan", "nutritional_status_sisvan.csv", "SISVAN", "Ministerio da Saude / APS municipal", "Estado nutricional agregado", "Mensal", "Usar faixas agregadas, sem medidas ou identificadores individuais."),
  source("pni", "immunization_pni.csv", "PNI", "Programa Nacional de Imunizacoes", "Cobertura vacinal agregada", "Mensal", "Competencia, denominador e metodo devem acompanhar cada carga."),
  source("ibge", "luziania_neighborhoods.geojson", "IBGE/territorio", "IBGE / Prefeitura de Luziania", "Geometrias territoriais de referencia", "Sob revisao", "Limites do MVP precisam ser substituidos ou homologados pela base oficial.")
];

export const dataFieldDictionary: DataFieldDefinition[] = [
  field("cnes", "cnes", "Codigo CNES", "texto", true, "publico_agregado", "Identificador publico do estabelecimento.", "Unico e referenciado pelo SISAB.", ["Dashboard", "Mapa"]),
  field("cnes", "name", "Nome da unidade", "texto", true, "publico_agregado", "Nome publico do estabelecimento.", "Nao pode estar vazio.", ["Mapa", "Ranking"]),
  field("cnes", "type", "Tipo da unidade", "texto", true, "publico_agregado", "UBS, CAIS, hospital ou outro.", "Deve pertencer ao dominio autorizado.", ["Mapa", "Filtros"]),
  field("cnes", "ibge_city_code", "Codigo IBGE", "texto", true, "publico_agregado", "Municipio de referencia.", "Obrigatorio 5212501 no escopo atual.", ["Integracao"]),
  field("cnes", "lat", "Latitude da unidade", "decimal", true, "publico_agregado", "Coordenada publica da unidade.", "Entre -90 e 90 e dentro do municipio.", ["Mapa"]),
  field("cnes", "lng", "Longitude da unidade", "decimal", true, "publico_agregado", "Coordenada publica da unidade.", "Entre -180 e 180 e dentro do municipio.", ["Mapa"]),
  field("sisab", "period", "Competencia", "data", true, "institucional_agregado", "Mes de referencia.", "Formato AAAA-MM e sem competencia futura.", ["Dashboard", "Series"]),
  field("sisab", "neighborhood_id", "Bairro", "texto", true, "institucional_agregado", "Chave territorial agregada.", "Deve existir no GeoJSON homologado.", ["Mapa", "Ranking"]),
  field("sisab", "unit_cnes", "Unidade de referencia", "texto", true, "institucional_agregado", "CNES responsavel pelo indicador.", "Deve existir no catalogo CNES ativo.", ["Dashboard"]),
  field("sisab", "condition", "Condicao prioritaria", "texto", true, "institucional_agregado", "Grupo de condicao monitorada.", "Deve pertencer ao dominio clinico do GIP.", ["Filtros", "Score"]),
  field("sisab", "target_population", "Populacao-meta", "inteiro", true, "institucional_agregado", "Denominador agregado da meta.", "Inteiro maior ou igual a zero.", ["Cobertura", "Metas"]),
  field("sisab", "registered_patients", "Pessoas cadastradas", "inteiro", true, "institucional_agregado", "Contagem agregada de cadastros.", "Sem identificacao e maior ou igual a zero.", ["Cobertura"]),
  field("sisab", "high_risk_patients", "Alto risco agregado", "inteiro", false, "institucional_agregado", "Contagem territorial de alto risco.", "Nao superar cadastrados; suprimir pequenas contagens.", ["Score", "Ranking"]),
  field("sisab", "early_returns", "Retornos precoces", "inteiro", false, "institucional_agregado", "Contagem agregada de retornos.", "Maior ou igual a zero.", ["Score", "Mutirao IA"]),
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
  field("ibge", "geometry", "Geometria territorial", "geometria", true, "publico_agregado", "Poligono territorial.", "GeoJSON valido e CRS documentado.", ["Mapa"]),
  field("ibge", "id", "Chave do bairro", "texto", true, "publico_agregado", "Identificador estavel.", "Unico e presente nos demais arquivos.", ["Integracao"])
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
  return {
    id,
    fileName,
    source: sourceName,
    owner,
    scope,
    frequency,
    status,
    trustBadges:
      status === "simulated_only"
        ? ["agregado", "simulado"]
        : ["publico_real", "agregado", "mvp_seed"],
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
