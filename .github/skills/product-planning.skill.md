# Skill: Product Planning (Maker Social)

## Objetivo
Planejar backlog do MVP de rede social Maker com foco em portfólio técnico, documentação automatizada e diferenciais de IA para Demo Day.

## Quando usar
- Definir roadmap de MVP.
- Quebrar épicos em histórias/subtarefas.
- Criar critérios de aceite objetivos para Jira.

## Entradas mínimas
- Visão do produto.
- Funcionalidades principais.
- Restrições de tempo/squad.
- Requisitos obrigatórios de IA (RAG, pipeline funcional, LGPD, métricas).

## Saídas esperadas
- Backlog por sprint (`Sprint 0/1/2`).
- Prioridade (`P0/P1/P2`).
- Estimativa em Story Points.
- Critério de aceite verificável por item.
- Indicadores IA por sprint (relevância, latência, validação vetorial).

## Regras deste projeto
- Priorizar fluxo central: publicar projeto -> engajar (`upvote`/`fork`) -> exportar PDF.
- Evitar histórias abstratas sem CA mensurável.
- Sempre mapear dependências Backend/Frontend/Design.
- Incluir `AI-Orchestrator` e dependências com n8n em histórias de IA.
- Incluir CA de ética/LGPD sempre que houver chamada para LLM externa.

## Metas IA de referência
- Relevância RAG: > 85%.
- Latência de pipeline IA + export (referência): < 15s.
- Evidência de validação por similaridade de cosseno.

## Template curto de história
- **Como** [persona]
- **Quero** [capacidade]
- **Para** [resultado]
- **CA** [condição testável]
