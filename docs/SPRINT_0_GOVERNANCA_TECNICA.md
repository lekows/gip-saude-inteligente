# Sprint 0 - Governanca tecnica

Data da verificacao: 23 de julho de 2026.

## Regras implementadas

- Scores individuais respeitam os limites de cada fator e o teto final de 100 pontos.
- Scores territoriais respeitam os limites de cada fator e o teto final de 100 pontos.
- Valores negativos, infinitos ou invalidos nao aumentam o score.
- Identificadores ficticios de CNS usam o formato explicito `SIM-CNS-000001`.
- Numeros de 15 digitos que possam parecer um CNS real nao sao aceitos como identificadores sinteticos.
- Cargas agregadas do SISAB sao bloqueadas quando contem colunas identificaveis de paciente.

## Limites do score individual

| Fator | Limite |
| --- | ---: |
| Pressao arterial alterada | 25 |
| Glicemia alterada | 20 |
| IMC/obesidade | 10 |
| Doencas cronicas | 15 |
| Baixa adesao medicamentosa | 10 |
| Retorno precoce | 10 |
| Vulnerabilidade/idade | 10 |

## Limites do score territorial

| Fator | Limite |
| --- | ---: |
| Cobertura baixa | 20 |
| Percentual de alto risco | 25 |
| Pacientes faltantes agregados | 15 |
| Retornos precoces | 10 |
| Tempo de espera | 10 |
| Carga de HAS/DM | 10 |
| Entrevistas 360 | 10 |

## Verificacao

As regras possuem testes automatizados executados por `npm run test:domain`.

## Dicionario minimo e rastreabilidade

Em 28 de julho de 2026, o MVP passou a manter um catalogo unico com:

- nove fontes conceituais de dados SUS e territoriais;
- 26 campos minimos documentados;
- tipo, obrigatoriedade, classificacao e regra de qualidade por campo;
- responsavel, periodicidade, escopo e status de homologacao por fonte;
- marcacao explicita do arquivo SIM como inteiramente simulado;
- integracao do mesmo catalogo com a pagina de qualidade dos dados.

O catalogo pode ser consultado em `/data-dictionary`. O status
`seed_pending_validation` significa que a estrutura e demonstrativa e ainda
nao equivale a uma extracao oficial autorizada.

## Proxima dependencia institucional

Antes de receber dados reais, o programa ainda precisa aprovar o dicionario de dados,
as fontes autorizadas, os perfis de acesso e a avaliacao de privacidade/etica.
