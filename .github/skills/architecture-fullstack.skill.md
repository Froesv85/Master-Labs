# Skill: Full Stack Architecture (Maker Social)

## Objetivo
Definir arquitetura inicial para API social, assets técnicos e geração assíncrona de PDF.

## Quando usar
- Modelar domínio (usuários/projetos/componentes).
- Projetar upload de arquivos e exportação de documentação.
- Definir comunicação entre serviços.

## Stack recomendada (MVP)
- `API`: Node.js + NestJS/Fastify
- `DB`: PostgreSQL
- `Queue`: Redis + BullMQ
- `Storage`: S3-compatible (S3/MinIO/R2)
- `PDF Worker`: Puppeteer (opção rápida de MVP)

## Modelo de dados obrigatório
- `users`
- `projects` (com `parent_project_id` para fork)
- `project_collaborators`
- `project_components` (BOM)
- `project_error_logs`
- `project_votes`
- `project_assets`
- `project_exports`

## Regras de arquitetura
- Upload deve ser direto no storage por URL assinada.
- Export de PDF deve rodar assíncrono com status (`queued/processing/done/failed`).
- Toda ação social crítica precisa de idempotência (ex.: upvote único).
- Falhas de export devem registrar causa e permitir retry controlado.

## Checklist de pronto
- Contratos de API versionados.
- Migrações reproduzíveis.
- Logs estruturados e healthcheck ativos.
