# Atualizacao Jira e Kanban - 07/04/2026

## 1) Atualizacao Jira (pronto para aplicar)

Status recomendado por issue:

| Jira | Tipo | Status sugerido | Evidencia de entrega |
|---|---|---|---|
| ML-32 | Sub-task | Done | Endpoint feed filtravel com category, q, page, pageSize e sort em app/api/projects/route.ts |
| ML-31 | Sub-task | Done | UI feed com filtros, busca, paginacao, cards e navegacao em app/(app)/feed/page.tsx |
| ML-30 | Sub-task | Done | Fork com parentId e fluxo no feed em app/api/projects/[id]/fork/route.ts |
| ML-21 | Story | Done | Feed de inovacoes funcional ponta a ponta (API + UI + ordenacao + upvote) |
| ML-20 | Story | Done | Log de dificuldades implementado com persistencia, endpoint GET/POST e timeline na pagina do projeto |
| ML-15 | Epic | In Progress | Features sociais nucleares em andamento acelerado |

Sugestao de comment para Story ML-21:

"Entrega concluida em 07/04: feed filtravel com category + busca textual + paginacao + ordenacao (newest, oldest, top), cards com acoes Ver/Fork/Upvote e integracao com API. Commits de referencia: 1fa2ccf, 3733114, d798cf8, a63bd49, caec27c, 81ddd91, c4c7d28."

Sugestao de comment para Story ML-20:

"Log de dificuldades concluido com persistencia em banco, endpoints GET/POST e timeline na pagina do projeto. Fechamento do ciclo social com navegacao Feed -> Projeto -> Profile e evidencia pronta para auditoria/PDF."

## 2) Resumo breve dos conceitos aplicados hoje

- API orientada a recursos: endpoints REST para feed, fork, voto e profile.
- Modelagem relacional pragmatica: uso de parentId para lineage de fork e ProjectVote com unicidade por usuario/projeto.
- Idempotencia de voto: segundo voto do mesmo usuario nao duplica registro.
- Consulta paginada com filtros compostos: category + q + sort + page/pageSize.
- Ordenacao com criterio deterministico: desempate por data e id para previsibilidade.
- UX social incremental: feed navegavel, detalhe de projeto e perfil do maker conectados.
- Entrega incremental com rastreabilidade: commits pequenos e frequentes por capacidade.

## 3) Quadro Kanban (atualizado)

### Done
- Setup base Next + Prisma + MySQL local
- Schema e seed com dados de teste
- Endpoint GET /api/projects
- Feed UI consumindo endpoint
- Busca textual no feed
- Ordenacao newest/oldest/top
- Fork endpoint + acao no card
- Upvote endpoint + contador
- Endpoint de profile maker
- Pagina de profile maker
- Navegacao social Feed -> Projeto -> Profile
- Log de dificuldades implementado com persistencia, endpoint GET/POST e timeline na pagina do projeto

### In Progress


### To Do (proximas imediatas)
- Adicionar teste de integracao basico para fluxos Feed/Fork/Vote/Profile
- Iniciar bloco n8n/Webhook da trilha S1-E1 com endpoint de extracao

## 4) Proximas etapas recomendadas (D+1)

1. Hardening minimo do social MVP:
- Tratamento de erros padronizado nas respostas
- Validacoes de entrada centralizadas

2. Preparacao para transicao S0.1 -> S1.1:
- Definir contrato do webhook de extracao
- Criar backlog tecnico do fluxo n8n + embeddings

## 5) Evidencia rapida de produtividade (commits do dia)

- a86d827 - initial setup
- ca9bc77 - schema + seed
- 1fa2ccf - endpoint feed
- 3733114 - feed page
- d798cf8 - busca textual
- a63bd49 - ordenacao newest/oldest
- caec27c - detalhe + fork
- 81ddd91 - upvote
- c4c7d28 - top voted
- 6eac199 - profile endpoint
- fd286e6 - profile page
- 295b7ed - link projeto -> profile
