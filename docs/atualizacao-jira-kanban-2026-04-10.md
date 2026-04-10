# Atualizacao Jira e Kanban - 10/04/2026

## 1) Atualizacao Jira (pronto para aplicar)

Status recomendado por issue para a conclusao do Pipeline AI (S1-E1):

| Jira | Tipo | Status sugerido | Evidencia de entrega |
|---|---|---|---|
| ML-37 | Sub-task | Done | Endpoint POST /api/projects/[id]/extract trigando n8n via webhook e persistindo log em `status: queued`. |
| ML-36 | Sub-task | Done | Integracao Vector DB (Pinecone REST API) e embeddings (`gemini-2.5-flash`) operacional no n8n JSON v3. |
| ML-35 | Sub-task | Done | Simulacao de extracao com `piiRedactions` conectada ao status salvo no banco. |
| ML-23 | Story | Done | Workflow completo via n8n (RAG, Webhook, Callbacks Front/Back), exibindo Requisitos e BOM. |
| ML-16 | Epic | In Progress | Falta consolidacao de metricas (ML-22), mas core do pipeline gerativo finalizado com estagio RAG. |

Sugestao de comment para Story ML-23:

"Workflow n8n RAG 100% estabilizado no MakerBrain. Implementado callback em background via Webhook para a API e exibicao dinamica dos resultados processados (BOM detalhado + Technical Requirements) na UI de detalhes do projeto sem timeout, com fallback para rate-limits (Google Gemini Cloud) no n8n. Ref: docs/n8n-workflow-v3-rag.json."

## 2) Resumo breve dos conceitos aplicados hoje

- **Arquitetura Assíncrona AI:** Utilizacao do `ProjectExtractionLog` para separar o tempo de execucao do webhook (1-2s) do RAG pipeline do Gemini (latencia imprevisivel de LLMs), melhorando a resiliencia da rota no front-end.
- **Polling UI-to-API:** Tela de carregamento assincrono no `extract-panel.tsx` que so consome a resposta final da LLM quando receber `status: done` confirmando callback n8n.
- **Design For AI-Failure (Graceful Degradation):** Configuracao de retry (15s backoff, 5 max) nos requests do n8n para tratar quotas de API e timeouts 503/429 sem queima do processo ou explosao no front-end do usuario.
- **Seguranca de Deserializacao AI:** Tipificacao rigorosa do jsonBody da API e tratamento de outputs alucinados (ex: JSON retornando lista de Objects ao inves de Strings) diretamente na UI.
- **Vetorizacao Realtime:** Transicao dos drivers legados para Pinecone RESTful Requests via n8n Node, reduzindo dependencias isoladas no conteiner.

## 3) Quadro Kanban (atualizado)

### Done
- Setup base Next + Prisma + MySQL local
- Feed UI e Backend de filtros/forks/votos
- Webhook de extracao texto
- Backend `[id]/extract` callback de sucesso 
- Integracao embeddings e busca vetorial (Pinecone via n8n)
- RAG generation usando Google Gemini API
- Robustez no n8n contra RateLimits do Google AI!
- Front-end atualizando estado com dados do RAG sem reload.

### In Progress
- S1-E1-H2 Medir qualidade e latencia do pipeline RAG

### To Do (proximas imediatas - Fase 6 PDF-Automation)
- S2-E1 Exportacao PDF auditavel (Epic ML-14)
- S2-E1-H1 Worker de geracao PDF
- Enriquecer Job Queue de PDF com BOM gerado pelo RAG do n8n.
