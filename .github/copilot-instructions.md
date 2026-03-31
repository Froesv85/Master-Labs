# Copilot Instructions for This Repository

## Current Repository State
- This repository is in early planning stage with product and delivery definitions documented.
- Use [AGENTS.md](../AGENTS.md) for role orchestration and ownership.
- Use skills in [.github/skills](./skills) for planning, architecture and delivery patterns.

## What AI Agents Should Do First
1. Read [AGENTS.md](../AGENTS.md) to choose the active specialist role.
2. Read the relevant skill in [.github/skills](./skills) before proposing implementation details.
3. Keep outputs aligned with the planned MVP: Maker portfolio + social repository + PDF documentation export.
4. When code is created, update this file with concrete file-path examples.

## Product Scope (MVP)
- Feed de Inovações com filtros por categoria (`3D Printing`, `Robotics`, `IoT`, `Woodworking`).
- Perfil Maker Professional com `Hardware Stack` e medalhas.
- Repositório social com `fork`, BOM interativa, log de dificuldades e coautoria.
- Diferencial: exportação de documentação técnica em PDF.
- Gamificação por `upvotes` e autoridade maker.

## Architecture Guidance
- Preferred baseline: API + Worker + Web.
- Suggested stack: Node.js (API), PostgreSQL (data), Redis/BullMQ (jobs), S3-compatible (assets), Puppeteer (PDF worker).
- PDF generation must be asynchronous with statuses: `queued`, `processing`, `done`, `failed`.
- Uploads should use signed URLs and direct-to-storage flow.

## Data Model Priorities
- Core entities: `users`, `projects`, `project_components`, `project_error_logs`, `project_votes`, `project_assets`, `project_exports`, `project_collaborators`.
- `projects.parent_project_id` is mandatory for fork lineage.
- `project_votes` must enforce one vote per user per project.

## Delivery Guidance
- Plan work in `Epic > Story > Sub-task` with objective acceptance criteria.
- Keep sprint checkpoints at D5 (mid-demo) and D10 (final demo).
- Track ownership by squad: Backend, Frontend, Design, Product.

## Maintenance Rule for This File
- Keep this document concise and evidence-based.
- Reflect only decisions approved in repository artifacts.
- Add concrete references to code paths once implementation begins.
