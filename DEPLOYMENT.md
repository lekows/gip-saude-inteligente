# Publicacao do GIP Saude Inteligente

Este MVP e um projeto Next.js com dados simulados e agregados. Ele nao deve conter dados reais ou identificaveis de pacientes.

## Caminho recomendado: GitHub + Vercel

1. Crie um repositorio privado ou publico no GitHub.
2. Envie o projeto para o GitHub.
3. No Vercel, importe o repositorio GitHub.
4. Use as configuracoes padrao detectadas para Next.js:
   - Framework: Next.js
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output: automatico
5. Publique e compartilhe o link gerado.

## Antes de enviar ao GitHub

Confira se estes itens nao serao enviados:

- `node_modules/`
- `.next/`
- `.tools/`
- arquivos `.env`
- logs locais
- arquivos `.zip`

Esses itens estao protegidos pelo `.gitignore`.

## Rotas principais para demonstracao

- `/` central operacional
- `/mobile` Busca Ativa GIP
- `/comunidade` pagina publica
- `/manager-dashboard` dashboard do gestor
- `/territorial-map` mapa territorial
- `/campaign-planner` planejamento de mutirao com IA simulada
- `/municipal-report` relatorio consolidado municipal
- `/municipal-goals` metas e pactuacao municipal
- `/data` hub de dados SUS

## Comandos locais

```bash
npm install
npm run dev
npm run build
npm start
```

## Observacoes de LGPD

- Nao usar dados reais de pacientes neste MVP.
- Exibir apenas dados agregados por bairro, unidade, campanha ou microarea.
- Nao publicar enderecos residenciais.
- Caso futuramente integre dados reais do SUS, usar somente bases publicas, anonimizadas ou agregadas.
