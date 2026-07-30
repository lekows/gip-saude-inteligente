# GIP Saude Inteligente

MVP de inteligencia territorial para saude publica em Luziania-GO, com dashboard gestor, mapa territorial, planejamento de mutiroes, relatorios, metas municipais e modulo mobile de busca ativa.

## Destaques

- Dashboard de gestao com KPIs, graficos e ranking territorial.
- Mapa de risco por bairro com UBS, CAIS e locais de mutirao.
- Planejamento de mutirao com IA simulada e rotas georreferenciadas.
- Execucao e relatorio pos-mutirao.
- Relatorio municipal consolidado.
- Metas e pactuacao municipal.
- Busca Ativa GIP em `/mobile`, com modo offline e fila local.
- Pagina publica em `/comunidade`.

## Tecnologias

- Next.js
- TypeScript
- Tailwind CSS
- React Leaflet
- Recharts
- Lucide React

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Build

```bash
npm run build
```

## Dados

O projeto usa dados mockados, simulados ou agregados. Nao ha dados reais identificaveis de pacientes.

## Publicacao

Veja [DEPLOYMENT.md](./DEPLOYMENT.md).

## Continuacao por outro agente

Leia [AGENTS.md](./AGENTS.md) e
[docs/HANDOFF_ANTIGRAVITY.md](./docs/HANDOFF_ANTIGRAVITY.md) antes de alterar o
projeto.
