# Master-Labs

MakerConnect: rede social técnica para governança de projetos IoT com automação documental via IA (RAG), n8n e trilha auditável.

## Visão do Projeto

O MakerConnect integra três pilares:
- camada social: feed, fork, upvote, profile e log de dificuldades;
- camada IA: extração, RAG, callback e métricas operacionais;
- camada documental: exportação PDF assíncrona com histórico.

Objetivo principal:
- reduzir esforço de documentação técnica em projetos maker IoT;
- aumentar rastreabilidade e reprodutibilidade;
- manter evidência técnica verificável para banca/operação.

## Status Atual (18/04/2026)

### Entregas já implementadas
- Next.js + Prisma + MySQL local;
- feed com filtros, busca, paginação e ordenação;
- fork com linhagem por `parentId`;
- upvote idempotente por usuário/projeto;
- log de dificuldades por projeto;
- pipeline de extração com anonimização de PII, keywords e webhook n8n;
- callback de extração com persistência de `status`, `latencyMs` e `output`;
- exportação PDF assíncrona com status e upload em MinIO/S3;
- endpoint de métricas para observabilidade (IA + PDF + recentes).

### Decisão de gates D10 (Jira)
- ML-56: **Concluído** (estabilidade do fluxo atendida).
- ML-57: **Em andamento** (bloqueado por otimização de latência/relevância).
- Epic de Fase 2: **ML-64** (`LLM Latency & Relevance Tuning`).
- Blocker técnico: **ML-65** (`Requires LLM Optimization (Phase 2)`).

## Stack Técnica

- Frontend/API: Next.js 16 + React 19
- ORM e dados transacionais: Prisma + MySQL
- Orquestração IA: n8n
- LLM/Embeddings locais: Ollama (`qwen2.5:7b-instruct`, `bge-m3`, fallback `llama3.1:8b`)
- Banco vetorial: Pinecone
- Object storage: MinIO/S3
- Geração PDF: jsPDF

## Arquitetura (Resumo)

Fluxo principal:
1. usuário aciona extração;
2. API sanitiza PII + extrai keywords + cria log `queued`;
3. API dispara n8n;
4. n8n roda embedding + retrieval + geração;
5. n8n chama callback na API com status/output;
6. API persiste resultado e expõe métricas;
7. usuário dispara exportação PDF;
8. PDF é gerado de forma assíncrona e enviado ao MinIO/S3.

## Qualidade, Ética e LGPD

- anonimização de PII antes da trilha de IA;
- rastreabilidade por estados assíncronos (`queued`, `processing`, `done`, `failed`);
- histórico operacional para auditoria técnica;
- backlog explícito para mitigação de risco de KPI IA.

## Como Executar

### 1) Ambiente principal (aplicação)

```bash
cd maker-connect
npm install
npm run dev
```

Aplicação: `http://localhost:3000`

### 2) Infra local de apoio (MySQL + MinIO)

```bash
cd maker-connect
docker compose up -d
```

## Documentos-Chave

### Arquitetura e banca
- `docs/c4-banca-makerconnect-2026-04-18.md`
- `docs/fala-apresentador-12-slides-2026-04-18.md`

### Operação e decisões D10
- `docs/d10-t2-estabilidade-fluxo-2026-04-17.md`
- `docs/d10-benchmark-final-2026-04-17.md`
- `docs/jira-closure-comments-d10-2026-04-18.md`

### IA/RAG e modelos
- `docs/plano-migracao-gemini-ollama.md`
- `docs/ollama-deployment-runbook.md`
- `docs/ollama-models-recommendation.md`

## Estrutura do Repositório

- `maker-connect/`: aplicação principal (web + API + prisma + scripts)
- `docs/`: documentação de produto, arquitetura, execução e banca
- `scripts/`: automações operacionais (incluindo Jira)
- `AGENTS.md`: orquestração de papéis e protocolo de trabalho

## Próximos Passos (Fase 2)

- otimizar latência (P50/P95) do pipeline IA;
- elevar relevância média RAG para meta de benchmark;
- reexecutar benchmark com critérios de aceite fechados;
- consolidar hardening para demonstração final e transição para UAT.
