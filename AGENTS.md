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
- Define fronteiras entre `API`, `Worker`, `Web`.
- Escolhe padrões de upload e jobs assíncronos.
- Garante segurança, rastreabilidade e escalabilidade inicial.

**Decisões-base do projeto**
- Backend orientado a API + fila.
- Geração de PDF assíncrona.
- Storage S3-compatible para assets.

## 3) `Backend-Platform`
**Missão:** implementar domínio e integrações.
- Modelagem relacional: usuários, projetos, componentes, votos, exports.
- Fluxos críticos: `fork`, `upvote`, `project_exports`.
- Observabilidade mínima: logs, healthcheck, retries.

## 4) `Frontend-Experience`
**Missão:** entregar UX técnico-visual (GitHub + Instagram).
- Feed com filtros por categoria.
- Perfil Maker Professional.
- Jornada de projeto (BOM, dificuldades, fork, export).

## 5) `PDF-Automation`
**Missão:** gerar documentação técnica reproduzível.
- Compilação de capa, BOM, diagrama, código Markdown e requisitos.
- Controle de estado: `queued`, `processing`, `done`, `failed`.
- Versionamento de exportações por projeto.

## 6) `Delivery-Manager`
**Missão:** operar o plano diário e risco.
- Acompanha metas D1–D10 por sprint.
- Reporta bloqueios com impacto e mitigação.
- Garante demo de meio e fim de sprint.

---

## Protocolo de trabalho entre agentes
1. `PM-Lead` abre escopo + CA.
2. `Architect-FullStack` valida impacto técnico.
3. `Backend-Platform` e `Frontend-Experience` quebram em subtarefas.
4. `PDF-Automation` entra em features de export/documentação.
5. `Delivery-Manager` monitora progresso e risco.

## Regra de ouro
Nenhum agente cria regra “genérica”. Toda decisão deve se conectar ao contexto do produto Maker definido neste repositório.
