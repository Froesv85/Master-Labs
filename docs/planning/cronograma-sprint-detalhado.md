# 📅 Cronograma Detalhado - MakerConnect Solo Dev

## Timeline Visual (04 de Abril - 01 de Julho 2026)

```
ABRIL                 MAIO                 JUNHO                JULHO
07---------15--------30    01---------15--------30    01---------15--------01(MVP)
|   S0.1    |  S1.1  | |  S1.2  |  S1.3   | |  S1.4/S2  | |
Week  1-2     3-4       5-6       7-8        9-10       11-12

CORES:
🟡 = Crítico/Bloqueador
🟢 = On-track
🔴 = Em risco
```

---

## 📊 Distribuição por Sprint (Vinicius Froes)

## ✅ Marco de Consistência (Atualização de Status)

- **S2-E1 concluído em 14/04/2026** (fechamento aplicado no Jira/Kanban: ML-14, ML-18, ML-19, ML-25, ML-26, ML-27, ML-28).

### **SPRINT S0.1 (Weeks 1-2: 04-15 Abril)**
**Foco:** Database + API Boilerplate + n8n Setup  
**Capacity:** 8 SP  
**Burn:** 8/8 (100%)

| Task | SP | Owner | Status | ETA | Notes |
|------|----|----|--------|-----|-------|
| DB Schema (users, projects, components, votes) | 2 | VF | 🟡 CRITICAL | Apr 08 | Usar MySQL + migrations padrão |
| Node.js API boilerplate (Express + DB conn) | 2 | VF | 🟡 CRITICAL | Apr 09 | Docker + docker-compose setup |
| n8n instance + Pinecone/Supabase connect | 2 | VF | 🟡 CRITICAL | Apr 10 | Webhook endpoint ready |
| S0-E1-H1-T1: Dataset holdout (10 IoT projects) | 1 | VF | 🟢 | Apr 12 | CSV format + import script |
| ADR + README + CI/CD boilerplate | 1 | VF | 🟢 | Apr 15 | GitHub Actions minimal |

**Deliverable:** ✅ `API running on :3000` + `n8n webhook active` + `DB with 10 test projects`  
**Demo:**  Zero-to-run script (`npm install && docker-compose up`)

---

### **SPRINT S1.1 (Weeks 3-4: 16-29 Abril)**
**Foco:** Webhook + Embeddings Pipeline  
**Capacity:** 8 SP  
**Burn:** 6/8 (75%) + 2 SP contingency buffer

| Task | SP | Owner | Status | ETA | Dependencies |
|------|----|----|--------|-----|-------|
| S1-E1-H1-T1: Webhook endpoint (text extract) | 2 | VF | 🟢 | Apr 20 | Após S0.1 ✅ |
| S1-E1-H1-T2: Embeddings generation + store | 2 | VF | 🟢 | Apr 23 | Pinecone integration |
| Webhook error handling + logging | 1 | VF | 🟡 | Apr 25 | Critical for prod |
| E2E test: upload → embed → store | 1 | VF | 🟡 | Apr 29 | Acceptance criteria |

**Deliverable:** ✅ `POST /api/projects/{id}/extract` returns embedding ID + metadata  
**Demo:** Upload IoT project sketch → Embedding stored in Pinecone

---

### **SPRINT S1.2 (Weeks 5-6: 30 Abr - 13 Maio)**
**Foco:** RAG Retrieval + LGPD Middleware  
**Capacity:** 8 SP  
**Burn:** 7/8 (88%)

| Task | SP | Owner | Status | ETA | Dependencies |
|------|----|----|--------|-----|-------|
| S1-E1-H1-T3: LGPD middleware (PII masking) | 2 | VF | 🔴 COMPLEX | May 02 | Após embeddings ✅ |
| n8n: extraction → retrieval flow | 2 | VF | 🔴 COMPLEX | May 06 | Antes S1.3 |
| Audit trail + logs | 1 | VF | 🟡 | May 09 | Mandatory LGPD |
| Integration test suite | 2 | VF | 🟡 | May 13 | Full pipeline |

**Deliverable:** ✅ Full pipeline: `input → anonymize → embed → retrieve → output`  
**Demo:** E2E pipeline with PII detection + redaction logs

---

### **SPRINT S1.3 (Weeks 7-8: 14-27 Maio)**
**Foco:** Observability + RAG Quality Eval  
**Capacity:** 8 SP  
**Burn:** 6/8 (75%) + 2 SP buffer

| Task | SP | Owner | Status | ETA | Dependencies | KPI |
|------|----|----|--------|-----|-------|-----|
| S1-E1-H2-T1: Latency instrumentation | 2 | VF | 🟡 | May 17 | Após pipeline ✅ | Track p50/p95 |
| S1-E1-H2-T2: RAG quality eval (holdout set) | 2 | VF | 🔴 CRITICAL | May 23 | Usar S0 dataset | **Target: ≥85% relevance** |
| Performance tuning (identify bottlenecks) | 1 | VF | 🟡 | May 26 | Based on metrics |
| Dashboard + metrics API | 1 | VF | 🟢 | May 27 | Visualization |

**Deliverable:** ✅ RAG quality score published + Dashboard showing latency trend  
**KPI:** ✅ **Latency < 15s** | **Relevance ≥ 85%**  
**Demo:** "Here's how accurate our RAG is vs baseline manual search"

---

### **SPRINT S1.4 (Weeks 9-10: 28 Maio - 10 Jun)**
**Foco:** Social Feed + Fork Lineage (PARALELO a S2)  
**Capacity:** 8 SP  
**Burn:** 8/8 (100%)

| Task | SP | Owner | Status | ETA | Dependencies |
|------|----|----|--------|-----|-------|
| S1-E2-H1-T1: Feed endpoint (filtros) | 2 | VF | 🟢 | Jun 02 | Após DB ✅ |
| S1-E2-H1-T2: React UI (categories) | 2 | VF | 🟡 CONTEXT SWITCH | Jun 04 | Webhook clean |
| S1-E2-H2-T1: Fork logic + sql | 2 | VF | 🟡 | Jun 07 | parent_project_id |
| Integration: Feed + Fork display | 2 | VF | 🟡 | Jun 10 | All endpoints |

**Deliverable:** ✅ Feed page showing filtered projects + Fork button working  
**Demo:** "Here are the top IoT projects, sorted by category + fork this one"

---

### **SPRINT S2.0 (Weeks 11-12: 11-24 Junho) — MVP Finalization**
**Foco:** PDF Export Worker  
**Capacity:** 8 SP  
**Burn:** 8/8 (100%)

**Status consolidado:** ✅ **S2-E1 concluído em 14/04/2026**

| Task | SP | Owner | Status | ETA | Dependencies |
|------|----|----|--------|-----|-------|
| S2-E1-H1-T1: Queue setup (BullMQ + Redis) | 2 | VF | 🟡 NEW STACK | Jun 13 | Após feedback S1 |
| S2-E1-H1-T2: Worker + Puppeteer | 2 | VF | 🔴 COMPLEX | Jun 17 | PDF rendering |
| PDF template (BOM + reqs + validation) | 2 | VF | 🟡 | Jun 19 | Design approval |
| Status tracking + endpoint history | 2 | VF | 🟡 | Jun 23 | UI for track |

**Deliverable:** ✅ Export project → PDF generated async + status tracking UI  
**Demo:** "Click export, see status in real-time, download PDF with full audit trail"

---

### **Buffer Week (25-01 Julho) — Contingency + Demo Prep**
**Foco:** Bug fixes + Performance tuning + Demo polish  
**Capacity:** Unlimited (as needed)

| Activity | Est. Time | Risk |
|----------|-----------|------|
| Critical bug fixes | 8h | 🟡 Medium |
| Performance optimization | 4h | 🟢 Low |
| Demo & Documentation | 4h | 🟢 Low |
| Contingency (delays) | 8h | 🔴 High |

---

## 🎯 MVP Feature Checklist (01 de Julho 2026)

### **INCLUIR:**
- [x] Feed com filtros por categoria (3D Printing, Robotics, IoT, Woodworking)
- [x] Visualização de projeto com metadados técnicos
- [x] Fork com rastreamento de lineage (parent_project_id)
- [x] Perfil Maker (básico: nome + projects + upvotes)
- [x] Upvote system (1 vote / user / project)
- [x] Log de dificuldades (texto + timestamp)
- [x] RAG pipeline funcional (>85% relevance)
- [x] PDF export assincrono com status (queued, processing, done, failed)
- [x] Webhook para n8n + embeddings no Pinecone
- [x] Middleware LGPD (PII masking)

### **DEFERIR para v1.1:**
- [ ] Medalhas/Gamificação avançada
- [ ] BOM interativa (Editar componentes)
- [ ] CV/Schematic parsing (requer ML training)
- [ ] Recomendações IA personalizadas
- [ ] Coautoria de projetos
- [ ] API tokens para integração externa
- [ ] Mobile responsive (apenas desktop MVP)

---

## 🚨 Critical Path Dependencies

```
START (Apr 04)
  ↓
[S0.1] DB + API Boilerplate (8 SP | Week 1-2)
  ├─ BLOCKS: S1.1 Webhook ✅
  ├─ BLOCKS: S1-E2 Feed ✅
  └─ BLOCKS: S2 Worker ✅
  ↓
[S1.1] Webhook + Embeddings (6 SP | Week 3-4)
  ├─ CRITICAL: No proceed to S1.2 without ✅ embeddings
  └─ BLOCKS: S1.2 RAG
  ↓
[S1.2] LGPD + RAG Retrieval (7 SP | Week 5-6) ⚠️ BOTTLENECK
  ├─ CRITICAL: Accuracy validation needed
  └─ BLOCKS: S1.3 Eval
  ↓
[S1.3] Observability + Quality (6 SP | Week 7-8)
  ├─ KPI validation: ≥85% relevance + <15s latency
  └─ DECISION GATE: Proceed to PDF export? OR iterate?
  ↓
[S1.4] Social (Feed + Fork) (8 SP | Week 9-10) — PARALLELIZABLE
  ├─ Can start Week 5 if DB ✅
  └─ BLOCKS: Demo content
  ↓
[S2.0] PDF Worker (8 SP | Week 11-12)
  └─ BLOCKS: Nothing (post-MVP feature for v1.1)
  ↓
[BUFFER] Demo + Polish (Week 25-01 Jul)
  ↓
LAUNCH ✅ (July 01 2026)
```

---

## ⚠️ Risk Mitigation Table

| Risk | Probability | Impact | Mitigation | Owner |
|------|-----------|--------|-----------|-------|
| Pinecone/API outage | 20% | 🔴 HIGH (1 day) | Local vector DB fallback | VF (WEEK 1) |
| n8n LLM integration delays | 30% | 🟡 MEDIUM (3 days) | Mock LLM responses for MVP | VF (WEEK 5) |
| React + Node context switch | 50% | 🟡 MEDIUM (-2 SP) | Use template/scaffold | VF (WEEK 3) |
| PDF rendering complexity | 40% | 🟡 MEDIUM (-2 SP) | Use existing lib (ReportLab) | VF (WEEK 11) |
| Database performance at scale | 15% | 🟢 LOW (1 day) | Indexing strategy drafted Week 1 | VF (WEEK 1) |
| Sick leave / Unexpected blocker | 10% | 🔴 HIGH (cascading) | Buffer week + doc ownership | — |

---

## 📈 Success Metrics (Go/No-Go at Each Sprint)

### **S0.1 Gate (Apr 15)**
✅ **Go:** API + DB running  
❌ **No-Go:** Can't attach to Pinecone

### **S1.1 Gate (Apr 29)**
✅ **Go:** Embeddings stored + webhook responding  
❌ **No-Go:** Instability or >2s latency per embed

### **S1.2 Gate (May 13)**
✅ **Go:** Full pipeline working + PII tests passing  
❌ **No-Go:** LGPD compliance gaps

### **S1.3 Gate (May 27) 🚨 CRITICAL**
✅ **Go:** RAG ≥85% relevance + <15s latency  
❌ **No-Go:** Either metric fails → iterate immediately

### **S1.4 Gate (Jun 10)**
✅ **Go:** Feed + fork displayed without bugs  
❌ **No-Go:** UI crashes or fork SQL broken

### **S2.0 Gate (Jun 24)**
✅ **Go:** PDF export working end-to-end  
❌ **No-Go:** PDF generation >30s or status tracking broken

### **MVP Gate (Jul 01) 🎯**
✅ **LAUNCH:** All KPIs met + demo successful  
❌ **DELAY:** Only if S1.3 quality gate failed

---

## 📱 Time Box per Sprint

| Activity | Time/Sprint |
|----------|-------|
| Development | 32h |
| Code review + merge | 2h |
| Documentation | 2h |
| Demo preparation | 2h |
| Contingency (bugs, tests) | 2h |
| **TOTAL** | **40h** |

**Burn rate:** 8 SP/sprint = 4 hours per story point (realistic with testing)

---

## 🔴 Red Flags to Watch

1. **Embedding latency > 5s per call** → Pinecone optimization needed
2. **LLM API timeouts > 10s** → Fallback to cached results
3. **DB queries > 100ms** → Need indexing ASAP
4. **React build time > 60s** → Split code or webpack optimization
5. **Any sprint > 90% burn** → Slip into next sprint immediately
6. **More than 2 bugs per sprint** → QA discipline needed

---

## 📋 Sign-Off Checklist

- [ ] **Vinicius Froes:** Confirms capacity of 8 SP/sprint feasible?
- [ ] **PM:** Agrees on "DEFERIR" features for v1.1?
- [ ] **Architect:** Validates tech stack dependencies?
- [ ] **Delivery:** Sets up sprint tracking in Jira?
- [ ] **All:** Comfortable with **NO BUFFER = CRITICAL SCHEDULE**?

**Signature:** _________________ **Date:** ________________
