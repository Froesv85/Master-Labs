# AGENTS.md — Rede Social Maker (MVP)

Este arquivo define agentes especialistas para execução coordenada do projeto.

## 1) `PM-Lead`
**Missão:** transformar visão em backlog executável.
- Define escopo MVP e prioridades (`P0`, `P1`).
- Mantém histórias com critério de aceite verificável.
- Controla dependências entre squads.

**Artefatos de saída**
- Backlog por sprint (S0/S1/S2).
- Quadro D1–D10.
- CSV de import para Jira.

## 2) `Architect-FullStack`
**Missão:** manter coerência técnica end-to-end.
- Define fronteiras entre `API`, `n8n`, `Worker`, `Web`.
- Escolhe padrões de upload e jobs assíncronos.
- Garante segurança, rastreabilidade e escalabilidade inicial.

**Decisões-base do projeto**
- Backend orientado a API + fila + orquestração n8n.
- Geração de PDF assíncrona.
- Storage S3-compatible para assets.

## 3) `AI-Orchestrator`
**Missão:** implementar e operar o `MakerBrain Agent`.
- Orquestra pipeline IA no n8n com gatilhos por webhook.
- Mantém fluxo RAG (embeddings, busca vetorial, grounding técnico).
- Executa pipeline de CV/NLP para extração de dados de esquemáticos.
- Define guardrails de ética/LGPD antes de chamadas para LLM externa.

## 4) `Backend-Platform`
**Missão:** implementar domínio e integrações.
- Modelagem relacional: usuários, projetos, componentes, votos, exports.
- Fluxos críticos: `fork`, `upvote`, `project_exports`.
- Integrações críticas: webhooks com n8n, storage e vetor DB.
- Observabilidade mínima: logs, healthcheck, retries.

## 5) `Frontend-Experience`
**Missão:** entregar UX técnico-visual (GitHub + Instagram).
- Feed com filtros por categoria.
- Perfil Maker Professional.
- Jornada de projeto (BOM, dificuldades, fork, export, sugestões IA).

## 6) `PDF-Automation`
**Missão:** gerar documentação técnica reproduzível.
- Compilação de capa, BOM, diagrama, código Markdown e requisitos.
- Integração com dados enriquecidos por RAG/CV vindos do n8n.
- Controle de estado: `queued`, `processing`, `done`, `failed`.
- Versionamento de exportações por projeto.

## 7) `Delivery-Manager`
**Missão:** operar o plano diário e risco.
- Acompanha metas D1–D10 por sprint.
- Reporta bloqueios com impacto e mitigação.
- Garante demo de meio e fim de sprint.
- Garante evidências de métricas IA para o Demo Day.

---

## Protocolo de trabalho entre agentes
1. `PM-Lead` abre escopo + CA.
2. `Architect-FullStack` valida impacto técnico.
3. `AI-Orchestrator` define fluxo n8n (RAG + CV/NLP + guardrails LGPD).
4. `Backend-Platform` e `Frontend-Experience` quebram em subtarefas.
5. `PDF-Automation` integra dados IA na documentação exportável.
6. `Delivery-Manager` monitora progresso, risco e métricas IA.

## Regra de ouro
Nenhum agente cria regra “genérica”. Toda decisão deve se conectar ao contexto do produto Maker definido neste repositório.
