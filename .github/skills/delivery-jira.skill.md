# Skill: Delivery & Jira Operations

## Objetivo
Transformar planejamento em execução diária com rastreabilidade no Jira.

## Quando usar
- Montar quadro D1–D10.
- Preparar CSV de import no Jira.
- Acompanhar progresso por squad.

## Estrutura padrão de entrega
- Hierarquia: `Epic > Story > Sub-task`
- Campos mínimos: `Issue Type`, `Summary`, `Epic Link`, `Priority`, `Story Points`, `Squad Owner`, `Description`, `Acceptance Criteria`, `Labels`

## Mapeamento de squads
- `Backend`: domínio, API, fila, storage, worker PDF
- `Frontend`: feed, perfil, editor de projeto, fluxo de export
- `Design`: sistema visual, fluxos, template PDF
- `Product`: priorização, escopo, critérios de aceite
- `AI-Orchestrator`: workflows n8n, RAG, CV/NLP, guardrails LGPD

## Regras de priorização
- `P0`: bloqueia entrega do MVP
- `P1`: alto valor sem bloquear go-live
- `P2`: melhoria futura

## Regra de milestones
- Demo de meio de sprint (D5)
- Demo final de sprint (D10)
- Todo item de demo deve ter CA objetivo e estado de integração válido
- Para features de IA, demo deve incluir evidência de pipeline n8n executando com input real.

## Indicadores mínimos
- % de subtarefas concluídas por squad
- SP entregue vs comprometido
- bloqueios abertos e tempo médio de resolução
- Relevância RAG medida (>85% alvo)
- Latência do pipeline IA até saída útil (<15s referência)
