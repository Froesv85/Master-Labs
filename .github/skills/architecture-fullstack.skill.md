# Skill: Full Stack Architecture (Maker Social)

## Objetivo
Definir arquitetura inicial para rede social Maker com API social, orquestração n8n, IA com RAG/CV-NLP e geração assíncrona de PDF.

## Quando usar
- Modelar domínio (usuários/projetos/componentes).
- Projetar upload de arquivos e exportação de documentação.
- Definir comunicação entre API, n8n, banco vetorial e worker.

## Stack recomendada (MVP)
- `API`: Node.js + NestJS/Fastify
- `Orquestração IA`: n8n (webhooks + workflows)
- `DB`: PostgreSQL
- `Queue`: Redis + BullMQ
- `Storage`: S3-compatible (S3/MinIO/R2)
- `Vector DB`: Pinecone ou Supabase pgvector
- `Embeddings`: text-embedding-3-small (ou equivalente)
- `LLM`: GPT-4o / Llama 3 via n8n
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

## Camada de IA (obrigatória)
- `MakerBrain Agent` com dois pipelines:
	1. `RAG` para sugestões técnicas com grounding em base local.
	2. `CV/NLP` para extração de metadados de imagens de esquemáticos.
- Fluxo n8n esperado: ingestão -> limpeza -> embeddings/busca -> resposta estruturada -> injeção no template PDF.

## Regras de arquitetura
- Upload deve ser direto no storage por URL assinada.
- Export de PDF deve rodar assíncrono com status (`queued/processing/done/failed`).
- Toda ação social crítica precisa de idempotência (ex.: upvote único).
- Falhas de export devem registrar causa e permitir retry controlado.
- Dados sensíveis devem ser anonimizados antes de chamadas para LLM externa (LGPD).
- Pipeline IA deve registrar tempo e resultado para auditoria de demo.

## Checklist de pronto
- Contratos de API versionados.
- Migrações reproduzíveis.
- Logs estruturados e healthcheck ativos.
- Webhooks n8n testados com payload versionado.
- Evidência de avaliação de recuperação vetorial (similaridade de cosseno).
