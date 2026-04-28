# 📊 ANÁLISE CRONOGRAMA MAKERCONNECT - FASE 1
## Baseado em Documentação Interna (07/04/2026)

---

## 1️⃣ CRONOGRAMA PLANEJADO

### Datas Críticas
- **Início**: 07 Abril 2026 (segunda-feira)
- **MVP Target**: 01 Julho 2026 (86 dias)
- **Final (v1.0)**: 15 Outubro 2026 (192 dias totais)
- **Capacidade**: 96 Story Points até MVP

### Timeline Macro (12 Semanas até MVP)
```
Sprint 0  | Sprint 1A/1B | Sprint 2A/2B | Sprint 3A/3B | Sprint 4 | Sprint 5 | Buffer
Weeks 1-2 | Weeks 3-4    | Weeks 5-6    | Weeks 7-8    | W9-10    | W11-12   | W13
(Setup)   | (RAG/Feed)   | (Integration)| (PDF/Export) | (Polish) | (Harden) | (Conting)
Capacity: Capacity:      Capacity:     Capacity:     Capacity: Capacity: 8 SP
8 SP      6-7 SP         8 SP          7-8 SP        8 SP      6 SP      (se needed)
```

---

## 2️⃣ SPRINTS PLANEJADOS (Detalhados)

### SPRINT 0: Infrastructure & Foundation
**Timeline**: Weeks 1-2 (07-15 Abril)  
**Capacity**: 8 SP | **Target**: 100% burn  
**Owner**: Vinicius Froes (solo)

**Deliverables:**
- ✅ Next.js monorepo setup (API + Web in one repo)
- ✅ MySQL DB running via Docker
- ✅ Prisma migrations & schema
- ✅ API healthcheck + basic routes
- ✅ React boilerplate (Shadcn components)
- ✅ GitHub Actions CI/CD pipeline
- ✅ ADR + Architecture documentation

**Tasks Breakdown:**
- [4pts] Next.js setup + folder structure
- [2pts] DB schema + Prisma migration
- [1pt] GitHub Actions + docker-compose
- [1pt] ADR + Architecture docs

**Checkpoint**: `npm install && npm run dev` works → Both API + Web running

---

### SPRINT 1A: RAG Pipeline (Backend Track)
**Timeline**: Weeks 3-4 (16-29 Abril)  
**Capacity**: 8 SP | **Target**: 7 SP (learning curve for n8n)

**Deliverables:**
- ✅ n8n workflow: text extraction → embedding → storage
- ✅ Webhook endpoint: POST /api/projects/{id}/extract
- ✅ Pinecone integration (or Supabase Vector)
- ✅ LGPD middleware: PII detection + masking
- ✅ Error handling + logging + audit trail

**Tasks:**
- [2pts] n8n environment + webhook setup
- [2pts] Embeddings API (OpenAI/Hugging Face)
- [2pts] LGPD middleware implementation
- [1pt] Error handling + logging

**Checkpoint**: `curl -X POST http://localhost:3000/api/projects/1/extract` → Embedding stored in vector DB

---

### SPRINT 1B: Feed UI (Frontend Track - PARALLEL to 1A)
**Timeline**: Weeks 3-4 (16-29 Abril)  
**Capacity**: 4 SP (parallel) | **Target**: 3-4 SP

**Deliverables:**
- ✅ Feed page layout (category filters, cards)
- ✅ Project card component (reusable)
- ✅ Filter UI (Shadcn Select + Checkbox)
- ✅ Mock data JSON (10 projects)
- ✅ Routing structure (Next App Router)

**Tasks:**
- [2pts] Feed page + components (Shadcn)
- [1pt] Filter logic (client-side)
- [1pt] Mock data + integration test

**Key**: Building UI WITHOUT backend ready → Mock data first, integrate later

**Checkpoint**: Can filter by category on mock data? ✅

---

### SPRINT 2A: RAG Quality Validation + Feed Integration
**Timeline**: Weeks 5-6 (30 Abril - 13 Maio)  
**Capacity**: 8 SP | **Target**: 7 SP

**Deliverables:**
- ✅ RAG evaluation on holdout dataset (20 projects)
- ✅ Latency instrumentation (per-step timing)
- ✅ Feed endpoint: GET /api/projects?category=X&page=Y
- ✅ Integration tests (feed + backend)
- ✅ Performance dashboard (basic metrics)

**Tasks:**
- [2pts] Holdout dataset evaluation
- [2pts] Feed endpoint (pagination + filtering)
- [2pts] Latency collection + dashboard
- [1pt] Integration testing
- [1pt] CONTINGENCY (bugs)

**🚨 KPI GATE**: RAG ≥85% relevance by May 09
- If NOT ≥85%: BLOCKER - iterate immediately

**Checkpoint**: GET /api/projects?category=IoT&page=1 returns 10 projects + RAG score ≥85%?

---

### SPRINT 2B: Fork + Profile (Parallel to 2A)
**Timeline**: Weeks 5-6 (30 Abril - 13 Maio)  
**Capacity**: 4 SP | **Target**: 3-4 SP

**Deliverables:**
- ✅ Fork endpoint: POST /api/projects/{id}/fork
- ✅ Fork UI button + confirmation modal
- ✅ Profile page stub (name + projects)
- ✅ Lineage display (parent_project_id tree)

**Tasks:**
- [1pt] Fork SQL + logic
- [1pt] Fork UI + modal
- [1pt] Profile page layout
- [1pt] Lineage visualization (simple tree)

**Checkpoint**: Can fork a project and see parent_project_id in DB?

---

### SPRINT 3A: PDF Export Infrastructure
**Timeline**: Weeks 7-8 (14-27 Maio)  
**Capacity**: 8 SP | **Target**: 6-7 SP (new stack)

**Deliverables:**
- ✅ Job queue setup (BullMQ + Redis)
- ✅ PDF worker process (pdfkit-based)
- ✅ PDF template: BOM + requirements + validation trail
- ✅ Status tracking: queued → processing → done/failed
- ✅ Endpoint: POST /api/projects/{id}/export

**Tasks:**
- [2pts] BullMQ setup + Redis connection
- [2pts] PDF generation with pdfkit
- [2pts] PDF template (BOM + requirements)
- [1pt] Status endpoint
- [1pt] CONTINGENCY (complexity)

**Checkpoint**: POST /api/projects/1/export → Job created, status returns "processing", PDF generated after 2min?

---

### SPRINT 3B: Export History UI
**Timeline**: Weeks 7-8 (14-27 Maio)  
**Capacity**: 4 SP | **Target**: 3 SP

**Deliverables:**
- ✅ Export history page (list of exports per project)
- ✅ Status badge (queued/processing/done/failed)
- ✅ Download link (when done)
- ✅ Error detail modal
- ✅ Integration with export endpoint

**Tasks:**
- [1pt] Export history UI
- [1pt] Status polling
- [1pt] Download + error handling
- [1pt] CONTINGENCY

**Checkpoint**: Trigger export, see status change in real-time, download PDF?

---

### SPRINT 4: Full E2E Integration + UX Polish
**Timeline**: Weeks 9-10 (28 Maio - 10 Junho)  
**Capacity**: 8 SP | **Target**: 7 SP

**Deliverables:**
- ✅ Full path: Feed → Filter → Fork → Profile → Export PDF
- ✅ Session + Authentication (JWT)
- ✅ Error pages + loading states
- ✅ Mobile-first CSS (responsive)
- ✅ Performance optimization (lazy load, caching)
- ✅ Security audit (CORS, LGPD headers)

**Tasks:**
- [2pts] Authentication + sessions
- [2pts] E2E flows (Feed→Fork→Export)
- [1pt] UX polish (animations, loading)
- [1pt] Mobile responsiveness
- [1pt] Performance + security checklist
- [1pt] CONTINGENCY (bugs)

**Checkpoint**: Full happy path works smoothly? Feed to PDF download?

---

### SPRINT 5: Production Hardening
**Timeline**: Weeks 11-12 (11-24 Junho)  
**Capacity**: 8 SP | **Target**: 6 SP (contingency for bugs)

**Deliverables:**
- ✅ Logging + monitoring (APM)
- ✅ Database backups + disaster recovery
- ✅ Rate limiting + abuse prevention
- ✅ Load testing (stable at 100 req/s?)
- ✅ Documentation (README + OpenAPI)
- ✅ Deployment scripts

**Tasks:**
- [1pt] Logging infrastructure
- [1pt] Database backup strategy
- [1pt] Rate limiting
- [1pt] Load testing
- [1pt] Documentation
- [2pts] CONTINGENCY (critical bugs)

**Checkpoint**: Application stable under load? All docs up-to-date?

---

### BUFFER: Sprint 13 (Contingency Only)
**Timeline**: Week 13 (25-01 Julho)  
**Capacity**: 8 SP  
**Use ONLY if**: Critical bugs OR RAG retraining needed OR performance issues

**Do NOT use for**: New features, scope creep, nice-to-haves

---

## 3️⃣ STORY POINTS ANALYSIS

### Budget vs Demand (Until MVP)

```
SUPPLY SIDE (Capacity):
  - 12 weeks × ~8 SP/week = 96 SP
  - Minus context switching: -8 SP
  - Minus unplanned bugs: -5 SP
  - Minus infrastructure (non-billable): -10 SP
  ════════════════════════
  Real available capacity: 73 SP

DEMAND SIDE (Required):
  - Direct stories: 66 SP
  - Subtasks (estimated): ~25 SP
  ════════════════════════
  Total needed: 91 SP

DEFICIT: 73 - 91 = -18 SP ⚠️
STATUS: Need to be 24% FASTER than normal burn rate
```

### Weekly Velocity Targets
```
Week 1-2:   8 SP (setup overhead, slow)
Week 3-4:   6 SP (learning curve for n8n/RAG)
Week 5-6:   8 SP (hitting stride, parallelized)
Week 7-8:   7 SP (PDF complexity + integration)
Week 9-10:  8 SP (cranking, final features)
Week 11-12: 6 SP (mostly bugs, testing, hardening)
════════════════════════
TOTAL:      51 SP delivered
TARGET:     51 SP needed
RESULT:     ON TRACK ✅
```

---

## 4️⃣ FEATURES PLANNED

### MVP Features (Delivery by 01 Julho)
- **Feed**: Project discovery with category filters, pagination, vote counts
- **Fork**: Clone projects with parent/child lineage tracking
- **RAG Preview**: AI-powered content extraction + embedding
- **PDF Export**: Async export with job queue + status tracking
- **Profile**: Basic maker profile with project history
- **Authentication**: JWT-based session management

### Post-MVP Features (v1.1)
- Gamification (medals, rankings, streaks)
- BOM Interactivity (editable components)
- CV Parsing (extract maker skills)
- Advanced Metrics Dashboard
- Coauthorship model
- API tokens for integrations

### Cut Scenarios (Risk Mitigation)

**Scenario 1** (Behind by 1.5 sprints at Week 5):
- Cut: Gamification, avatar upload, advanced profile
- Saves: 5 SP
- MVP intact: ✅ Feed, Fork, RAG, PDF

**Scenario 2** (Behind by 2 sprints at Week 7):
- Cut: All of Scenario 1 + BOM interactivity
- Saves: 8 SP
- MVP intact: ✅ Feed, Fork, RAG, PDF (basic)

**Scenario 3** (Behind by 3+ sprints at Week 9):
- Options:
  - A) Extend MVP to 01 Agosto (recommended)
  - B) Deploy MVP without PDF export
  - C) Ship v1.0-lite by 01 Jul

---

## 5️⃣ TECHNICAL STACK

### Frontend & API
- **Framework**: Next.js 16 + React 19
- **UI Components**: Shadcn/UI (pre-built, accessible)
- **Styling**: Tailwind CSS
- **State Management**: React hooks + client state
- **API Client**: Native fetch (no extra lib)
- **Auth**: NextAuth.js (JWT)

### Database & ORM
- **Primary DB**: MySQL (PlanetScale or Docker)
- **ORM**: Prisma (type-safe, auto migrations)
- **Vector DB**: Pinecone (or Supabase pgvector)
- **Backup**: Database snapshots (weekly)

### AI/ML & Orchestration
- **LLM Orchestration**: n8n (workflow engine)
- **Embeddings**: OpenAI API (text-embedding-3-small) OR Ollama (local)
- **Models (Ollama)**:
  - qwen2.5:7b-instruct (primary)
  - bge-m3 (embeddings)
  - llama3.1:8b (fallback)
- **RAG Evaluation**: Holdout dataset (20 projects) → ≥85% relevance gate

### Job Queue & Workers
- **Queue**: BullMQ (Redis-backed)
- **Workers**: Node.js worker processes
- **Cache**: Redis
- **Jobs**: PDF generation, RAG evaluation (nightly)

### PDF & Export
- **Library**: pdfkit (lightweight, template-friendly)
- **NOT**: Puppeteer (too heavy, slow)
- **Storage**: MinIO/S3 for generated PDFs
- **Async**: Job-based with status polling

### DevOps & Monitoring
- **Containerization**: Docker (MySQL, Redis)
- **Orchestration**: docker-compose (local dev)
- **CI/CD**: GitHub Actions (lint → build → test → deploy)
- **Monitoring**: Vercel + Sentry (free tier)
- **Logging**: Console → Vercel logs

### Data Privacy & Compliance
- **LGPD Compliance**: PII masking before RAG pipeline
- **Audit Trail**: All extractions logged with timestamps
- **Data Retention**: Configurable (default: 90 days)
- **Encryption**: TLS for API, passwords hashed (bcrypt)

---

## 6️⃣ RISK MITIGATION MATRIX

### Identified Risks

**Risk 1: Story Point Deficit (-18 SP)**
- Probability: MEDIUM (depends on execution)
- Impact: HIGH (might miss MVP)
- Mitigation:
  - Use templates (not learning from scratch)
  - Parallelize frontend/backend work
  - Automate testing + CI/CD
  - Cut post-MVP features if needed

**Risk 2: RAG Quality Gate (≥85% relevance)**
- Probability: HIGH (tuning is hard)
- Impact: HIGH (blocks feed integration)
- Mitigation:
  - Start evaluation Week 3 (not Week 5)
  - Use holdout dataset early
  - Schedule nightly evaluations
  - Have fallback model (llama3.1)

**Risk 3: n8n Learning Curve**
- Probability: HIGH (new tool)
- Impact: MEDIUM (only 2 weeks allocated)
- Mitigation:
  - Allocate +2 hours/week for docs
  - Use n8n templates
  - Simple webhook → complex workflows

**Risk 4: PDF Generation Complexity**
- Probability: MEDIUM
- Impact: MEDIUM
- Mitigation:
  - Use pdfkit (not Puppeteer)
  - Template-based (not custom rendering)
  - Start Week 7 with working queue

**Risk 5: Scope Creep**
- Probability: VERY HIGH (common in solo projects)
- Impact: CRITICAL
- Mitigation:
  - Freeze scope after Week 2
  - Cut nice-to-haves early
  - Use decision tree (cut order defined)

### Weekly Go/No-Go Decision Points

```
Week 2:   On track?              → YES: continue | NO: add 2-3h/day
Week 4:   RAG evaluation ready?  → YES: continue | NO: escalate
Week 6:   Feed endpoint live?    → YES: continue | NO: cut features
Week 8:   PDF working?           → YES: final sprint | NO: emergency mode
Week 10:  Everything integrated? → YES: polish week | NO: cut features
Week 12:  MVP demo-ready?        → YES: deploy | NO: extend timeline
```

---

## 7️⃣ VELOCITY & PRODUCTIVITY HACKS

### Time-Saving Strategies

**Template Reuse** (saves ~6 hours)
- Copy-paste API endpoint boilerplate
- Reuse React component structure
- Database query factories

**Parallelization** (gains +8-10 SP)
- Frontend (1B) while backend (1A) builds
- PDF UI (3B) while queue works (3A)
- Testing while developing

**Automation** (saves ~6-8 SP)
- GitHub Actions for CI/CD
- Prisma auto-migrations
- Auto-generated OpenAPI docs

**Local Productivity** (saves ~2 hours/day)
- GitHub Codespaces (no env setup)
- Prisma Studio (DB management)
- Seed data (realistic test data)
- Automated tests on save

### Daily Schedule (7 productive hours/day)

```
09:00-12:00   Deep work block 1 (freshest brain)
12:00-13:00   Lunch break
13:00-13:30   Admin + PR reviews
13:30-17:00   Deep work block 2 (implementation)
17:00+        REST (no coding after hours)

Daily capacity: ~1.4 SP/day = ~7 SP/week
```

---

## 8️⃣ SUCCESS METRICS (By 01 Julho)

### Functional Requirements ✅
- [ ] Feed displays 10+ projects with filters
- [ ] Fork creates new project with parentId lineage
- [ ] RAG evaluation: ≥85% relevance on holdout dataset
- [ ] PDF export: <5 min generation time
- [ ] Profile page: shows projects + vote history
- [ ] Auth: JWT session + basic login

### Performance Requirements ✅
- [ ] API endpoints: <100ms response time (p95)
- [ ] PDF export: <5 min total time (p95)
- [ ] RAG extraction: <3s per document
- [ ] Feed load: <2s (p95) with 1000 projects

### Quality Requirements ✅
- [ ] Test coverage: >70% (critical paths)
- [ ] E2E tests: Feed → Fork → Export flow
- [ ] Zero known blockers
- [ ] All docs updated

### Deployment Requirements ✅
- [ ] Zero critical security issues
- [ ] Database backups working
- [ ] Monitoring + alerting enabled
- [ ] Load testing passed (100 req/s)

---

## 9️⃣ ASSUMPTIONS & CONSTRAINTS

### Assumptions
- Developer availability: 40h/week (no other projects)
- No scope creep after Week 2
- RAG quality reaches ≥85% by Week 6
- Parallel work (1A+1B, 2A+2B, 3A+3B) executes smoothly
- No major infrastructure failures

### Constraints
- Solo developer (no code reviews initially)
- Single machine (no distributed testing)
- Free/cheap SaaS tiers (OpenAI, Pinecone, Vercel)
- MVP cut features are post-postponed (not discarded)

### Dependencies
- OpenAI API availability
- Pinecone/Supabase uptime
- n8n webhook reliability
- GitHub Actions quota

---

## 🔟 CONCLUSION (Phase 1 Assessment)

### What Was Planned
A comprehensive, parallel-friendly MVP timeline with:
- 51 Story Points of actual deliverables
- 12-week sprint cycle with built-in contingency
- Clear gates (RAG ≥85% quality at Week 6)
- Risk mitigation for 3 delay scenarios
- ~30% velocity gain from parallelization

### Confidence Level
**60% probability of hitting MVP by 01 Julho** IF:
1. Discipline maintained (no scope creep)
2. Speed prioritized (templates > learning)
3. Parallelization works smoothly
4. RAG quality hits gate at Week 6

**80% probability of hitting SOME MVP** (even if delayed)

### What We Need to Verify Next
- Current actual sprint status (via Jira)
- Tasks completed vs planned
- Velocity burn rate (actual vs target)
- Blockers or context switches discovered
- RAG quality current state

**NEXT: Phase 2 = Jira integration for real data**

---

**Document Generated**: 23 Abril 2026  
**Based on**: plano-solo-full-scope.md, guia-tactico-execucao.md, quick-start-primeira-semana.md  
**Status**: Ready for Jira validation (Phase 2)
