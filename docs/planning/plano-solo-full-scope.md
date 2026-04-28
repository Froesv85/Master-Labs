# 🚀 Plano de Implementação - MakerConnect Solo (Full Scope)

**Desenvolvedor:** Vinicius Froes (100%)  
**Escopo:** COMPLETO (sem cortes)  
**Início:** 07 Abril 2026 (terça-feira)  
**MVP:** 01 Julho 2026 (86 dias)  
**Final:** 15 Outubro 2026 (192 dias)  
**Estratégia:** ⚡ **VELOCITY MAXIMIZE** + 🎯 **RISK MITIGATE**

---

## 📊 Realidade Brutal

```
Capacity: 96 SP (até MVP)
Necessário: 66 SP (stories diretas)
Subtasks: ~25 SP (estimado)
Context switch cost: -8 SP
Bugs/Unplanned: -5 SP
Infrastructure: -10 SP (não faturável)
────────────────────────
Disponível real: 96 - 8 - 5 - 10 = 73 SP
Escopo final: 66 + 25 = 91 SP
────────────────────────
DEFICIT: -18 SP ⚠️
```

**Isso significa:** Você precisa ser **24% mais rápido** que burn rate padrão, OU **18 SP de features viram MVP-lite**.

---

## 🔥 Estratégia: VELOCITY MAXIMIZE

### **Principio 1: No Context Switch (Template > Fresh)**

Em vez de aprender cada stack do zero:

```
❌ EVITAR: "Vou aprender React→Node→n8n→PDF"
✅ FAZER: "Vou usar templates prontos + adaptar"

Templates recomendados:
- Backend: Next.js full-stack (API + DB integrado)
- Frontend: Shadcn/UI React (componentizado)
- Queue: Bull (simples no Node)
- PDF: pdfkit (template-lt, não Puppeteer complexo)
```

**Impacto:** -2 a 3 SP em setup, +3 SP em velocity (6h ganhos).

---

### **Principio 2: MVP Estratégico (80/20)**

Features com **máximo impacto visual + mínima complexidade:**

```
HIGHLIGHT FEATURES (MVP):
✅ Feed social (visuualmente impressionante)
✅ Fork com lineage (core do project)
✅ RAG preview (AI magic moment)
✅ PDF export (diferencial)

HIDDEN COMPLEXITY FEATURES (Post-MVP):
⏸️ Gamification (medalhas, rankings)
⏸️ BOM interativo (editable components)
⏸️ CV parsing (ML training)
⏸️ Advanced metrics dashboard
```

Isso é aceite de MVP? **SIM** - foi aprovado em requirements.

---

### **Principio 3: Parallelizar ao Máximo**

```
Cronografia TRADICIONAL (serial):
W1-2  [S0] DB setup
W3-4  [S1-E1] n8n + RAG
W5-6  [S1-E1] Quality eval
W7-8  [S1-E2] Feed + Fork
W9-10 [S1-E2] Testing
W11-12 [S2] PDF
────────────────────────
12 semanas (sequencial = serial blocker)

Cronografia OTIMIZADA (paralelo):
W1-2  [S0] DB setup
W3-4  [S1-E1] n8n setup              + [S1-E2] React scaffold + endpoint mockups
W5-6  [S1-E1] Embeddings + RAG       + [S1-E2] Feed UI (usando mock data)
W7-8  [S1-E1] Quality eval           + [S1-E2] Fork logic + integration
W9-10 [S1-E1-final] Tuning + S1-E2 integration
W11-12 [S2] PDF worker + final testing
────────────────────────
12 semanas (paralelo = ~30% velocity gain)
```

**Impacto:** +8-10 SP de capacity (paralelização).

---

### **Principio 4: Automação Agressiva**

```
NÃO REFAZER:
- DB migrations: Use Prisma generate
- OpenAPI docs: Auto-generate from code
- Tests: Use factories + fixtures (não mock manual)
- Deployment: GitHub Actions templates prontos

TEMPO ECONOMIZADO: ~6-8 SP
```

---

## 📅 Cronograma AGRESSIVO - 12 Semanas até MVP

### **SPRINT 0 (Weeks 1-2: 04-15 abril)**

**Meta:** Infrastructure + Foundation  
**Capacity:** 8 SP | **Target Burn:** 100%

```
🎯 Deliverables:
✅ Next.js monorepo setup (API + Web in one repo)
✅ MySQL DB running (Docker)
✅ Prisma migrations (schema.prisma auto-generated)
✅ API healthcheck + basic routes
✅ React boilerplate (Shadcn components)
✅ GitHub Actions CI/CD (lint + test)

Tasks:
├─ [4pts] Next.js setup + folder structure
├─ [2pts] DB schema + Prisma
├─ [1pt] GitHub Actions + docker-compose
├─ [1pt] ADR + Architecture docs (this is critical for solo)

⏱️ Time breakdown:
Mon 04-08: M-F → Database + Next setup (24h)
Mon 11-15: M-F → CI/CD + React scaffold (16h)

Dependencies: NONE (green light to go)
```

**Checkpoint:** Can you run `npm install && npm run dev` and see both API + Web running?

---

### **SPRINT 1A (Weeks 3-4: 16-29 april) — Backend/IA Track**

**Meta:** RAG Pipeline MVP  
**Capacity:** 8 SP | **Target:** 7 SP (learn n8n)

```
🎯 Deliverables:
✅ n8n workflow: text extraction → embedding → storage
✅ Webhook endpoint: POST /api/projects/{id}/extract
✅ Pinecone integration (or Supabase Vector)
✅ LGPD middleware: PII detection + masking
✅ Basic logging + audit trail

Tasks:
├─ [2pts] n8n environment + webhook setup
├─ [2pts] Embeddings API (OpenAI/Hugging Face integration)
├─ [2pts] LGPD middleware implementation
├─ [1pt] Error handling + logging

⏱️ Time breakdown:
Mon 16-20: Setup n8n, learn webhook model (20h)
Mon 23-27: Embedding API + integration (16h)

⚠️ Learning curve here. Budget +2h extra study.
```

**Checkpoint:** `curl -X POST http://localhost:3000/api/projects/1/extract -d "..."` → Embedding stored in vector DB?

---

### **SPRINT 1B (Weeks 3-4 PARALLEL: 16-29 april) — Frontend Track**

**Meta:** Feed UI Structure (using MOCK DATA)  
**Capacity:** 4 SP (parallel to 1A) | **Target:** 3-4 SP

```
🎯 Deliverables:
✅ Feed page layout (category filters, cards)
✅ Project card component (reusable)
✅ Filter UI (Shadcn Select + Checkbox)
✅ Mock data JSON (10 projects)
✅ Routing structure (Next App Router)

Tasks:
├─ [2pts] Feed page + components (Shadcn)
├─ [1pt] Filter logic (client-side for now)
├─ [1pt] Mock data + integration test

⏱️ Time breakdown:
Mon 16-20: Component structure (12h)
Mon 23-27: Integration with mock data (8h)

NOTE: You're building UI WITHOUT backend ready yet.
This is OK - feed on mock data first, integrate later.
```

**Checkpoint:** Can you filter by category on mock data? Good.

---

### **SPRINT 2A (Weeks 5-6: 30 apr-13 may) — Backend + Quality**

**Meta:** RAG Quality Validation + Feed Integration  
**Capacity:** 8 SP | **Target:** 7 SP

```
🎯 Deliverables:
✅ RAG evaluation on holdout dataset (20 projects)
✅ Latency instrumentation (per-step timing)
✅ Feed endpoint: GET /api/projects?category=X&page=Y
✅ Integration tests (feed + backend)
✅ Performance dashboard (basic metrics)

Tasks:
├─ [2pts] Holdout dataset evaluation
├─ [2pts] Feed endpoint (pagination + filtering)
├─ [2pts] Latency collection + dashboard
├─ [1pt] Integration testing
├─ [1pt] CONTINGENCY (bugs)

⏱️ Time breakdown:
Mon 30-May 04: RAG eval + metrics (16h)
Mon 07-11: Endpoint + integration (16h)

🚨 KPI GATE: RAG ≥85% relevance (@May 09)
If NOT ≥85%: BLOCKER - iterate immediately
```

**Checkpoint:** `GET /api/projects?category=IoT&page=1` returns 10 projects + RAG score ≥85%?

---

### **SPRINT 2B (Weeks 5-6 PARALLEL: 30 apr-13 may) — Fork + Profile**

**Meta:** Fork Logic + Basic Profile  
**Capacity:** 4 SP | **Target:** 3-4 SP

```
🎯 Deliverables:
✅ Fork endpoint: POST /api/projects/{id}/fork
✅ Fork UI button + confirmation modal
✅ Profile page stub (name + projects)
✅ Lineage display (parent_project_id tree)

Tasks:
├─ [1pt] Fork SQL + logic
├─ [1pt] Fork UI + modal
├─ [1pt] Profile page layout
├─ [1pt] Lineage visualization (simple tree)

⏱️ Time breakdown:
Mon 30-May 04: Fork backend (8h)
Mon 07-11: Fork UI + Profile (16h)
```

**Checkpoint:** Can you fork a project and see parent_project_id in DB?

---

### **SPRINT 3A (Weeks 7-8: 14-27 may) — PDF Export**

**Meta:** PDF Worker Setup + Generation  
**Capacity:** 8 SP | **Target:** 6-7 SP (new stack)

```
🎯 Deliverables:
✅ Job queue setup (BullMQ + Redis)
✅ PDF worker process (pdfkit-based)
✅ PDF template: BOM + requirements + validation trail
✅ Status tracking: queued → processing → done/failed
✅ Endpoint: POST /api/projects/{id}/export (returns job ID)

Tasks:
├─ [2pts] BullMQ setup + Redis connection
├─ [2pts] PDF generation with pdfkit
├─ [2pts] PDF template (BOM + requirements)
├─ [1pt] Status endpoint
├─ [1pt] CONTINGENCY (complexity)

⏱️ Time breakdown:
Mon 14-18: Queue setup + worker (16h)
Mon 21-25: PDF template + status (16h)

⚠️ PDF rendering can be tricky. Use pdfkit (simple) not Puppeteer (slow).
```

**Checkpoint:** `POST /api/projects/1/export` → Job created, status returns "processing", PDF generated after 2min?

---

### **SPRINT 3B (Weeks 7-8 PARALLEL: 14-27 may) — Export UI + Refinement**

**Meta:** Export History UI + Integration  
**Capacity:** 4 SP | **Target:** 3 SP

```
🎯 Deliverables:
✅ Export history page (list of exports per project)
✅ Status badge (queued/processing/done/failed)
✅ Download link (when done)
✅ Error detail modal
✅ Integration with export endpoint

Tasks:
├─ [1pt] Export history UI
├─ [1pt] Status polling
├─ [1pt] Download + error handling
├─ [1pt] CONTINGENCY
```

**Checkpoint:** Can you trigger export, see status change in real-time, download PDF?

---

### **SPRINT 4 (Weeks 9-10: 28 may-10 jun) — Integration + Polish**

**Meta:** Full End-to-End + UX Polish  
**Capacity:** 8 SP | **Target:** 7 SP

```
🎯 Deliverables:
✅ Full path: Feed → Filter → Fork → View Profile → Export PDF
✅ Session + Authentication (basic JWT)
✅ Error pages + loading states
✅ Mobile-first CSS (responsive)
✅ Performance optimization (lazy load, caching)
✅ Security audit (CORS, LGPD headers)

Tasks:
├─ [2pts] Authentication + sessions
├─ [2pts] E2E flows (Feed→Fork→Export)
├─ [1pt] UX polish (animations, loading states)
├─ [1pt] Mobile responsiveness
├─ [1pt] Performance + security checklist
├─ [1pt] CONTINGENCY (bugs)

⏱️ Time breakdown:
Mon 28-Jun 01: Auth + E2E (16h)
Mon 04-08: Polish + optimization (16h)

No new features. Only integration + refinement.
```

**Checkpoint:** Full happy path works smoothly? From feed to PDF download?

---

### **SPRINT 5 (Weeks 11-12: 11-24 jun) — Production Hardening**

**Meta:** Bug Fixes + Deployment Prep  
**Capacity:** 8 SP | **Target:** 6 SP (contingency for bugs)

```
🎯 Deliverables:
✅ Logging + monitoring (basic APM)
✅ Database backups + disaster recovery
✅ Rate limiting + abuse prevention
✅ Load testing (is it stable at 100 req/s?)
✅ Documentation (README + API docs auto-generated)
✅ Deployment scripts (one-click deploy)

Tasks:
├─ [1pt] Logging infrastructure
├─ [1pt] Database backup strategy
├─ [1pt] Rate limiting
├─ [1pt] Load testing
├─ [1pt] Documentation
├─ [2pts] CONTINGENCY (critical bugs discovered in S3-4)

⏱️ Time breakdown:
Mon 11-15: Monitoring + backups (12h)
Mon 18-22: Testing + deployment (16h)
```

**Checkpoint:** Application stable under load? All docs up-to-date?

---

### **SPRINT BUFFER (Week 13: 25-01 july) — Final Push**

**Capacity:** 8 SP (if needed) | **Allocated as:** CONTINGENCY ONLY

```
Use ONLY if:
- Critical bugs from production testing
- Performance doesn't meet <15s latency
- Deployment issues
- RAG quality retraining needed

Do NOT use for:
- New features
- Scope creep
- Nice-to-haves

If you need this buffer → you'll know immediately.
```

**Checkpoint:** Go/No-Go decision by Jun 28.

---

## 🎯 Velocity Hacks (Your Weapons)

### **Hack 1: Reusable Components (React)**
```javascript
// Define ONCE, use EVERYWHERE
const ProjectCard = ({ project, onFork, onExport }) => (...)

// Use in: Feed, Search, Profile, Fork Results
// Time saved: ~4 hours in UI development
```

### **Hack 2: API Response Factories (Backend)**
```typescript
// Prisma select shortcut
const projectSelect = {
  id: true,
  title: true,
  category: true,
  embedding_id: true,
  parent_id: true,
}

// Use in every query
// Time saved: ~2 hours in API consistency
```

### **Hack 3: Database Indexes (SQL)**
```sql
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_parent ON projects(parent_id);
CREATE INDEX idx_embeddings_project ON embeddings(project_id);

-- Add BEFORE week 3
-- Time saved: ~5 hours debugging slow queries later
```

### **Hack 4: CI/CD Auto-Testing**
```yaml
# GitHub Actions: Run tests on every commit
# Catch bugs EARLY instead of week 11
# Time saved: ~3 hours manual testing
```

### **Hack 5: Scheduled n8n Workflows**
```
Instead of manual evaluation in S2A:
- Setup n8n to run RAG eval EVERY NIGHT
- Get metrics in morning
- Spot issues immediately

Time saved: ~2 hours batch evaluation
```

**Total time hacks:** ~16 hours regained = 2 SP extra capacity ✅

---

## 🚨 Risk Mitigation Plan (If You Fall Behind)

### **SCENARIO 1: By Week 5, you're 1 sprint behind**

```
Action:
1. Cut gamification (medalhas, rankings) → Post-MVP
2. Simplify profile (no avatar upload, just name + projects)
3. Use mock evaluation for RAG (non-holdout)

Saves: ~5 SP
New timeline: Back on track

MVP Features still intact: ✅ Feed, Fork, RAG preview, PDF
```

### **SCENARIO 2: By Week 7, you're 2 sprints behind**

```
Action:
1. Cut all of above + BOM interactivity
2. Profile becomes read-only
3. PDF export is basic (no audit trail details)

Saves: ~8 SP
New timeline: Week 13 stretch goal

MVP Features still intact: ✅ Feed, Fork, RAG, PDF (basic)
```

### **SCENARIO 3: By Week 9, you're 3+ sprints behind**

```
DECISION GATE:
- Option A: Extend MVP to 01 August (add 4 weeks)
- Option B: Deploy MVP without PDF export (core only)
- Option C: Delay full release, ship v1.0-lite by 01 Jul

Recommend: Option A (most stakeholder-friendly)
```

---

## 💪 Psychological Wins (Weekly Morale Checks)

```
Week 2:   "I have a running API" ✅ (morale: high)
Week 4:   "RAG is evaluating in n8n" ✅ (morale: high)
Week 6:   "Feed works with real data" ✅ (morale: VERY high)
Week 8:   "Exported first PDF!" ✅ (morale: peak)
Week 10:  "Everything is integrated" ✅ (morale: sustained)
Week 12:  "Only bugs left" ✅⚠️ (morale: stressed but winning)
```

Use these moments to **celebrate progress** and keep energy up.

---

## 📋 Weekly Checklist (Copy to Jira!)

```
Every Monday:
□ Review sprint goal
□ Check velocity (target 8 SP)
□ Identify blockers early
□ Update risk register

Every Wednesday:
□ Mid-sprint sync with yourself
□ Any new issues?
□ Adjust remaining tasks?

Every Friday:
□ Sprint retrospective (10min)
□ What went well?
□ What was hard?
□ Velocity actual vs planned?
□ Update next sprint plan
```

---

## 🔴 The Hard Truth

```
"Vinicius, you have 12 weeks and ~91 SP to deliver."

Realistically:
- 60% chance of success if you follow this plan exactly
- 80% chance of hitting MVP (even if v1.0 delayed)
- 15% chance of burnout

What will determine success:
1. Discipline (no scope creep, no new tech exploration)
2. Speed (templates > learning from scratch)
3. Status quo (parallelization over perfectionism)
4. Sleep (don't sacrifice rest for coding)
```

---

## ✅ Go/No-Go Checklist Before Week 1

- [ ] You have confirmed 40h/week availability (no other projects)
- [ ] You understand the 60% success probability (not guaranteed)
- [ ] You've set up local dev environment (Node, MySQL, Docker)
- [ ] You have Jira organized with this plan imported
- [ ] You've blocked calendar for Sprints (no meetings W1-12)
- [ ] You've told stakeholders: MVP hit-date is optimistic, not certain
- [ ] You've agreed on fallback (Option A/B/C above) if you slip

---

**Decision:** 🚀 READY? Then let's GO!

**Next step:** Import this cronograma into Jira + create Sprint 0 board.
