# Backlog - Log de Dificuldades

## Objetivo
Fechar a Story ML-20 com um registro simples e rastreavel de dificuldades tecnicas por projeto.

## Escopo minimo para MVP
- Criar endpoint para listar dificuldades de um projeto.
- Criar endpoint para registrar dificuldade com timestamp.
- Exibir timeline de dificuldades na pagina de detalhe do projeto.
- Permitir apenas append no MVP; edicao pode ficar para v1.1.

## Conceito aplicado
- Linha do tempo de incidentes/obstaculos para suportar governanca e reproducibilidade.
- Registro temporal ajuda a explicar tradeoffs, bloqueios e solucoes adotadas.
- O log vira evidencia para o PDF tecnico e para a auditoria do projeto.

## Historias sugeridas

### Story: Log de dificuldades por projeto
**Como** maker, **quero** registrar dificuldades tecnicas em um projeto, **para** documentar bloqueios e aprendizados durante a execucao.

**Acceptance criteria**
- O usuario consegue criar uma dificuldade com texto e timestamp.
- O usuario consegue listar as dificuldades de um projeto em ordem cronologica decrescente.
- Cada item mostra data/hora e descricao.
- A API retorna erros padronizados para payload invalido.

### Sub-task: Persistir dificuldade no banco
- Criar tabela `project_difficulties`.
- Relacionar com `projects`.
- Indexar por `project_id` e `created_at`.

### Sub-task: Endpoint de dificuldade
- `POST /api/projects/[id]/difficulties`
- `GET /api/projects/[id]/difficulties`

### Sub-task: Timeline na UI
- Adicionar card de timeline na pagina do projeto.
- Incluir form simples para novo registro.

## Sugestao de prioridade
- Story: High
- Sub-tasks: Medium/High

## Critério de pronto
- Timeline visível na pagina do projeto.
- Registro persistido no banco.
- Evidencia pronta para entrar no PDF tecnico.

## Status de entrega
- Implementado em 07/04/2026 no endpoint `/api/projects/[id]/difficulties` e na timeline da pagina do projeto.
- Story ML-20 pode ser marcada como concluida no Jira.
