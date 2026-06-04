# Template — Jira (Epic > Story > Sub-task)

## Como usar
1. Duplique este modelo para cada feature.
2. Preencha os campos obrigatórios.
3. Converta para CSV quando for importar no Jira.

---

## EPIC
- **Issue Type:** Epic
- **Summary:** [EX: S1-E2 Feed + Interações Sociais]
- **Priority:** [P0 | P1 | P2]
- **Story Points:** [total estimado do épico]
- **Squad Owner:** [Backend+Frontend+Design]
- **Description:** [objetivo do épico em 1-2 frases]
- **IA Validation Scope:** [baseline com/sem IA | holdout RAG | LGPD | latencia]
- **Acceptance Criteria:**
  - [resultado de negócio verificável]
  - [escopo mínimo entregue]
- **Métricas IA do épico:**
  - [relevancia RAG > 85% quando aplicavel]
  - [latencia fluxo IA + documentacao < 15s referencia de demo]
  - [evidencia de anonimização de PII antes da LLM]
- **Labels:** [mvp,sprint-1,feed]

## STORY
- **Issue Type:** Story
- **Epic Link:** [Summary exato do Epic]
- **Summary:** [EX: S1-E2-H1 Feed de Inovações com filtros]
- **Priority:** [P0 | P1 | P2]
- **Story Points:** [1,2,3,5,8]
- **Squad Owner:** [Backend+Frontend]
- **Description:** [capacidade entregue ao usuário]
- **Medição obrigatória:** [como medir impacto com/sem IA]
- **Acceptance Criteria:**
  - [condição testável 1]
  - [condição testável 2]
  - [evidencia de governanca/rastreabilidade quando aplicavel]
- **Labels:** [sprint-1,feed]

## SUB-TASK
- **Issue Type:** Sub-task
- **Epic Link:** [Summary exato do Epic]
- **Summary:** [EX: S1-E2-H1-T1 Endpoint feed filtrável]
- **Priority:** [P0 | P1 | P2]
- **Story Points:** [1,2,3]
- **Squad Owner:** [Backend | Frontend | Design | Product]
- **Description:** [entrega técnica objetiva]
- **Acceptance Criteria:**
  - [critério técnico verificável]
  - [log/artefato de validacao anexado]
- **Labels:** [backend,api,sprint-1]

---

## Convenções do projeto
- Prioridade `P0` bloqueia MVP.
- Milestones obrigatórias: demo D5 e demo D10.
- Toda Story deve ter pelo menos 2 critérios de aceite objetivos.
- Toda Sub-task deve mapear exatamente 1 responsável principal.
- Toda Epic com IA deve explicitar baseline de validacao e metricas alvo.
- Toda Story com IA deve incluir evidencias: qualidade RAG, latencia ou LGPD.
