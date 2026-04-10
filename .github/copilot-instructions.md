# Copilot Instructions for This Repository

## Current Repository State
- This repository is in early planning stage with product and delivery definitions documented.
- Use [AGENTS.md](../AGENTS.md) for role orchestration and ownership.
- Use skills in [.github/skills](./skills) for planning, architecture and delivery patterns.
- Treat MakerConnect as an IoT project governance platform, not only a social feed.

## What AI Agents Should Do First
1. Read [AGENTS.md](../AGENTS.md) to choose the active specialist role.
2. Read the relevant skill in [.github/skills](./skills) before proposing implementation details.
3. Keep outputs aligned with the planned MVP: Maker portfolio + social repository + automated PDF technical documentation.
4. When code is created, update this file with concrete file-path examples.

## Product Scope (MVP)
- Feed de Inovações com filtros por categoria (`3D Printing`, `Robotics`, `IoT`, `Woodworking`).
- Perfil Maker Professional com `Hardware Stack` e medalhas.
- Repositório social com `fork`, BOM interativa, log de dificuldades e coautoria.
- Diferencial: exportação de documentação técnica em PDF.
- Diferencial IA: `MakerBrain Agent` orquestrado via n8n (RAG + CV/NLP).
- Gamificação por `upvotes` e autoridade maker.
- Objective extension: governance and traceability of IoT projects.

## Architecture Guidance
- Preferred baseline: Web + API + n8n + Worker.
- Suggested stack: React (web), Node.js (API), MySQL (social data), Redis/BullMQ (jobs), S3-compatible (assets), n8n (orchestration), Puppeteer (PDF worker), Pinecone/Supabase (RAG).
- PDF generation must be asynchronous with statuses: `queued`, `processing`, `done`, `failed`.
- Uploads should use signed URLs and direct-to-storage flow.
- n8n should orchestrate AI pipeline: extraction -> preprocessing -> RAG retrieval -> post-processing.
- Anonymize sensitive data before external LLM calls (LGPD requirement).
- Prefer GPT-4o and/or Llama 3 with domain-grounded prompts and evidence retrieval.

## Mandatory Functional AI Pipeline
- Extraction: parse text/images from maker inputs and normalize technical metadata.
- Pre-processing: generate embeddings, run cosine similarity, filter/anonymize PII.
- Model stage: retrieve technical evidence via vector search and generate structured SW/HW requirements.
- Post-processing: render auditable PDF output and register validation logs.

## Research Framing and Validation
- Problem statement: reduce "ghost documentation" in IoT maker projects.
- Expected impact: reduce documentation effort while improving reproducibility and hardware reuse.
- Validation baseline: compare workflow with and without AI pipeline.
- RAG quality target: relevance > 85%.
- Pipeline + documentation latency target: < 15s reference for demo.

## Data Model Priorities
- Core entities: `users`, `projects`, `project_components`, `project_error_logs`, `project_votes`, `project_assets`, `project_exports`, `project_collaborators`.
- `projects.parent_project_id` is mandatory for fork lineage.
- `project_votes` must enforce one vote per user per project.
- Add AI layer artifacts: embeddings index metadata, inference logs, and pipeline execution traces.
- Persist governance evidence: export history, change lineage, and validation status per project.

## Delivery Guidance
- Plan work in `Epic > Story > Sub-task` with objective acceptance criteria.
- Keep sprint checkpoints at D5 (mid-demo) and D10 (final demo).
- Track ownership by squad: Backend, Frontend, Design, Product.
- Track IA KPIs for demo: RAG relevance target (>85%) and pipeline latency target (<15s reference).
- Ensure each sprint includes at least one measurable reproducibility artifact.

## Maintenance Rule for This File
- Keep this document concise and evidence-based.
- Reflect only decisions approved in repository artifacts.
- Add concrete references to code paths once implementation begins.
