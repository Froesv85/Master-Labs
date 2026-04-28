# Análise de Viabilidade - MakerConnect MVP (1 Dev)

**Desenvolvedor:** Vinicius Froes (único integrante)  
**Datas:** 06 Abril 2026 → MVP 01 Julho 2026 → v1.0 15 Outubro 2026  
**Deadlines:** MVP (86 dias) | Final (192 dias)

---

## 📊 Resumo Executivo

| Métrica | Valor | Status |
|---------|-------|--------|
| **Story Points Totais** | 41 SP | Moderate |
| **Sprints (2 semanas)** | 13 (até final) / 6 (até MVP) | ✅ |
| **Séries Críticas Identificadas** | 6 | ⚠️ High Risk |
| **Taxa Recomendada (1 dev)** | 5 SP/sprint | Assumida |
| **Sprints Necessários** | ~8-9 sprints | >90% capacity |
| **Recomendação** | 🚨 **CRÍTICA - Revisar escopo ou adicionar recurso** | ❌ Inviável |

---

## 📋 Análise de Stories por Épico

### **S0 - Fundação Técnica e Governança IA** (MVP P0)
**Sprint:** S0 (Semanas 1-2)  
**Objetivo:** Baseline de validação com/sem IA + setup arquitetura

| ID | Story | SP | Squad | Crítico | Bloqueador |
|----|----|---|-------|---------|-----------|
| 1002 | Planejamento de validação IA | 5 | Product | 🔴 | ❌ |
| 1003 | Dataset holdout | 2 | AI | 🔴 | Antes de 1002 |
| 1004 | Baseline sem IA | 2 | Product | 🔴 | Antes de 1002 |

**Subtotal S0:** 9 SP | **Duração:** ~2 sprints | **Risco:** ALTO - Estabelece baseline comparativo

**Aceite MVP:**
- ✅ Dataset de 10-20 projetos IoT versionado
- ✅ Protocolo de medição RAG vs manual  
- ✅ Métricas de linha de base coletadas
- ✅ Checklist de coleta aprovado

---

### **S1 - Pipeline IA n8n + Repositório Social** (MVP P0)
**Sprints:** S1 (Semanas 3-10)  
**Objetivo:** Pipeline IA funcional + feed e fork social

#### **S1-E1: Pipeline IA n8n com RAG e LGPD**

| ID | Story | SP | Squad | Crítico | Dependencies |
|----|----|----|-------|---------|-------------|
| 2002 | Orquestrar workflow n8n | 8 | AI-Orch | 🔴 | Depende S0 |
| 2003 | Webhook texto/imagem | 3 | Backend | 🔴 | Depois 2002 |
| 2004 | Embeddings + busca vetorial | 3 | AI | 🔴 | Depois 2002 |
| 2005 | Middleware LGPD | 3 | Backend | 🟡 | Paralelo a 2004 |
| 2006 | Medir latência pipeline | 5 | Backend | 🔴 | Depois 2005 |
| 2007 | Coletar latência/etapo | 2 | Backend | 🟢 | Depois 2006 |
| 2008 | Avaliação RAG | 2 | AI | 🔴 | Depois 2006 |

**Subtotal S1-E1:** 26 SP | **Duração:** ~4-5 sprints | **Risco:** 🚨 **CRÍTICO**

**Aceite MVP:**
- ✅ Workflow n8n executa ponta-a-ponta
- ✅ PII anonimizada antes LLM
- ✅ Latência < 15s (pipeline completo)
- ✅ RAG relevance ≥ 85% testado

#### **S1-E2: Repositório Social e Rastreabilidade**

| ID | Story | SP | Squad | Crítico | Dependencies |
|----|----|----|-------|---------|-------------|
| 3002 | Feed com filtros | 5 | Frontend | 🟡 | Paralelo |
| 3003 | Endpoint feed | 2 | Backend | 🟡 | Antes 3004 |
| 3004 | UI filtros | 3 | Frontend | 🟡 | Depois 3003 |
| 3005 | Fork lineage | 5 | Backend | 🟡 | Paralelo |
| 3006 | Persistir fork tree | 2 | Backend | 🟢 | Depois 3005 |
| 3007 | Log dificuldades | 3 | Frontend | 🟢 | Depois 3006 |

**Subtotal S1-E2:** 20 SP | **Duração:** ~3-4 sprints | **Risco:** 🟡 **MÉDIO**

**Aceite MVP:**
- ✅ Feed filtrável por `3D Printing`, `Robotics`, `IoT`, `Woodworking`
- ✅ Fork com lineage consultável (`parent_project_id`)
- ✅ Log de dificuldades persistido por projeto

**S1 Total:** 46 SP | **Timeline MVP:** Semanas 3-10 (~4.5 sprints)

---

### **S2 - Exportação PDF Auditável** (MVP P0)
**Sprints:** S2 (Semanas 6-12)  
**Objetivo:** Geração assincrona de documentação técnica com trilha

| ID | Story | SP | Squad | Crítico | Dependencies |
|----|----|----|-------|---------|-------------|
| 4002 | Worker PDF | 8 | Backend+PDF | 🔴 | Depois S1-E1 |
| 4003 | Job queue | 3 | Backend | 🔴 | Antes 4002 |
| 4004 | Template PDF | 3 | PDF-Auto | 🟡 | Paralelo 4002 |
| 4005 | Histórico exports | 5 | Frontend | 🟢 | Depois 4002 |
| 4006 | Endpoint histórico | 2 | Backend | 🟢 | Antes 4005 |
| 4007 | Tela status | 3 | Frontend | 🟢 | Depois 4006 |

**Subtotal S2:** 24 SP | **Duração:** ~3.5 sprints | **Risco:** 🟡 **MÉDIO-ALTO**

**Aceite MVP:**
- ✅ Job queue com retry + DLQ
- ✅ PDF com requisitos SW/HW + BOM + trilha validação
- ✅ Status `queued` → `processing` → `done`/`failed`

---

## ⏰ Timeline Realista - Único Desenvolvedor

### **Pressupostos de Capacidade**
```
Capacidade de trabalho: ~40h/semana
Overhead (reuniões, docs, debugging): ~20%
Capacidade efetiva: 32h/semana = 8 SP/sprint (burn rate conservador)
```

### **Distribuição de Sprints até MVP (01 Julho)**

```
S0  | Semanas 1-2   | Fundação IA + Validação          | 9 SP   | ✅ CRÍTICO
    | Semanas 3-4   | Setup DB + Infra n8n              | 8 SP   | 🔧 DEV
S1  | Semanas 5-6   | Webhook + Embeddings              | 8 SP   | 🔴 On track
    | Semanas 7-8   | RAG + LGPD middleware             | 8 SP   | 🔴 On track
    | Semanas 9-10  | Feed + Fork                        | 8 SP   | 🟡 Tight
    | Semanas 11-12 | Histórico + Métricas              | 8 SP   | 🟡 Crunch
S2  | Semanas 13+   | Worker PDF (post-MVP)             | 8 SP   | ⏸️ POC
```

**Cenário MVP (01 Julho = 12 semanas):**
- **Possível:** 12 sprints × 8 SP = 96 SP capacidade
- **Necessário:** ~41 SP (stories) + ~25 SP (sub-tasks estimado) = 66 SP
- **Margem:** +30 SP buffer ✅ **VIÁVEL COM RISCO**

---

## 🚨 Riscos Críticos - Single Developer

### 1️⃣ **Série de Dependências S0 → S1-E1 → S2**
```
[S0: Dataset] ─→ [S1-E1: n8n] ─→ [S2: PDF Worker]
     ✅                ✅              ✅
     (Baseline para avaliar RAG)
     (Enflui dados no S2)
```
**Impacto:** Atraso em S0 = atraso cascata até S2  
**Mitigação:** Paralelizar S1-E2 (Social) desde week 3

### 2️⃣ **Mudança de Contexto Entre Stacks**
- **Backend Node.js:** API + DB + Queue  
- **Frontend React:** Feed + Forms  
- **IA/n8n:** Workflow + Prompts + RAG  
- **PDF/Worker:** Puppeteer + Layout  

**Custo:** ~1h/dia em context switching = 10% capacity loss  
**Impacto:** -4 SP/sprint efetivos  
**Realidade:** 96 × 0.90 = 86.4 SP disponíveis para MVP

### 3️⃣ **Sem Backfill em Bug Fixe/Suporte**
- 1 dev = sem contingência
- Bloqueador externo (Jira, Pinecone, n8n) = impacto total
- Deploy failures = no escalation

**Risco:** 10-15% do tempo absorvido = 8-12 SP perdidos

### 4️⃣ **Arquitetura Complexa**
- Integração n8n com Node.js via webhook  
- Pinecone/Supabase setup + embeddings  
- MySQL + Redis setup  
- React build + deployment  

**Estimado:** 15-20 SP only para infrastructure (não faturável como feature)

---

## 📊 Cenário Realista: Capacidade Efetiva Necessária

| Fator | % | SP Impactados |
|------|---|---|
| Base capacity (8 SP/sprint) | 100% | 8 |
| Context switching (-10%) | -10% | -0.8 |
| Bugs/Unplanned (-5%) | -5% | -0.4 |
| **Efetivo por sprint** | **85%** | **6.8 SP/sprint** |
| **Sprints até MVP (12)** | — | **81.6 SP total** |

**Escopo MVP:** ~66 SP  
**Margem:** 81.6 - 66 = **15.6 SP de buffer** ✅ **Apertado, mas viável**

---

## 📅 Plano de Sprint (Proposto)

### **Fase 1: Fundação (S0) - Weeks 1-2**
```
SPRINT 0.1 (W1-2)
├─ [2pts] Database schema: users, projects, components, exports, votes
├─ [2pts] n8n environment setup + Pinecone/Supabase conexão
├─ [2pts] Node.js API boilerplate + healthcheck
├─ [2pts] S0-E1-H1-T1 Dataset holdout (10 IoT projects)
└─ [1pt] README + ADRs (Architecture Decision Records)

Deliverable: ✅ Schema + API running + Test data loading
```

### **Fase 2: Core IA Pipeline (S1-E1) - Weeks 3-9**
```
SPRINT 1.1 (W3-4)
├─ [3pts] S1-E1-H1-T1 Webhook endpoint (texto/imagem parsing)
├─ [3pts] S1-E1-H1-T2 Embeddings generation + Pinecone store
├─ [2pts] Route + error handling
└─ [1pt] End-to-end test

Deliverable: 🟢 Webhook working → embeddings stored

SPRINT 1.2 (W5-6)
├─ [3pts] S1-E1-H1-T3 LGPD middleware (PII masking)
├─ [3pts] n8n: extraction → embedding → retrieval flow
├─ [1pt] logs + audit trail
└─ [1pt] Integration tests

Deliverable: 🟢 Full pipeline inference (16s latency)

SPRINT 1.3 (W7-8)
├─ [2pts] S1-E1-H2-T1 Latency collection (instrumentation)
├─ [2pts] S1-E1-H2-T2 RAG evaluation (holdout dataset)
├─ [2pts] Dashboard: latency trends
├─ [1pt] Performance tuning
└─ [1pt] Demo + docs

Deliverable: ✅ RAG quality > 85% | Latency < 15s
```

### **Fase 3: Social Feed + Fork (S1-E2) - Weeks 5-10 (Paralelo)**
```
SPRINT 1.4 (W9-10)
├─ [2pts] S1-E2-H1-T1 Feed endpoint (filtros, paginação)
├─ [2pts] S1-E2-H1-T2 Feed UI (React + categories)
├─ [2pts] S1-E2-H2-T1 Fork logic + parent_project_id
├─ [1pt] Integration tests
├─ [1pt] E2E testing (feed + fork)
└─ [0.5pt] Performance baseline

Deliverable: 🟢 Feed working + fork with lineage
```

### **Fase 4: PDF Export (S2) - Post-MVP / Weeks 11-12**
```
SPRINT 2.0 (W11-12) — MVP Finalization
├─ [3pts] S2-E1-H1-T1 Queue setup (BullMQ + Redis)
├─ [3pts] S2-E1-H1-T2 Worker + Puppeteer PDF render
├─ [2pts] Template (BOM + requisitos + validação)
├─ [1pt] Status tracking (queued → processing → done)
└─ [1pt] Demo prep

Deliverable: 🟢 PDF export working with trails
```

---

## 🎯 MVP v1.0 Final Cut (01 July 2026)

**Incluir no MVP:**
- ✅ Feed com filtros (4 categorias)
- ✅ Maker profile básico
- ✅ Fork com lineage
- ✅ RAG pipeline funcional (>85% relevance)
- ✅ PDF export assincrono
- ✅ Validação baseline IA vs Manual

**Deferir para v1.1 (post-Demo Day):**
- 🔲 Medalhas/Gamificação (complexo em 1 dev)
- 🔲 BOM interativa (depende DB design)
- 🔲 CV/NLP de esquemáticos (ML training)
- 🔲 Sugestões IA personalizadas (requer user embeddings)

---

## ⚠️ Recomendações Críticas

### **Opção 1: Manter Solo + Reduzir Escopo (RECOMENDADO)**
```
Remover do MVP v1.0:
- CV/Schematic parsing → Use manual sketches instead
- Full gamification → Just upvotes
- Advanced RAG → Simple keyword search MVP

Impacto: -15 SP → 51 SP total = 2 sprint buffer
Status: ✅ VIÁVEL
```

### **Opção 2: Estender Deadline MVP**
```
MVP agora em 15 Agosto (11 semanas extras) = 18 semanas total
Capacity: 18 sprints × 8 SP = 144 SP
Status: ✅ VIÁVEL com folga
```

### **Opção 3: Adicionar 1 Dev Part-Time**
```
Part-time Frontend Dev (20h/week = 4h efetivos/semana):
Foco: React UI + PDF templates
Libertar Vinicius para Backend + IA
Status: ✅ ALTAMENTE RECOMENDADO
```

---

## 📈 Evolução Pós-MVP (15 Oct 2026)

**Total disponível:** 192 dias = 27 sprints × 8 SP = 216 SP

**Distribuição:**
- MVP (01 Jul): ~66 SP (36%)
- Refinement (Jul-Aug): ~20 SP (bugs, tuning, optimization)
- v1.1 Features (Set-Out): ~40 SP (gamification, advanced RAG, mobile)
- Contingency: ~90 SP (production issues, scaling)

---

## 📋 Checklist Sprint 0-1

- [ ] Banco de dados criado + migrations
- [ ] API Node.js rodando + docker-compose
- [ ] n8n instance up + webhook configurado
- [ ] Pinecone/Supabase conectado
- [ ] Dataset holdout importado
- [ ] Primeira embedding gerada
- [ ] React scaffold criado
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring + alerts básicos

---

## 🔴 Conclusão

**Um único desenvolvedor pode entregar MVP em 01 Julho 2026, MAS:**

1. **Requer disciplina extrema:** Sem scope creep
2. **Margens agudas:** ~15 SP buffer apenas = sem atrasos
3. **Context switching custoso:** Precisa serializar bem as tarefas
4. **Sem contingência:** Qualquer bloqueador externo atrasa tudo
5. **Sem suporte:** Nenhuma fallback técnica

**Recomendação final:** 🚨 **Adicionar part-time Frontend Dev + reduzir CV/Gamification do MVP = VIÁVEL COM RISCO ACEITÁVEL**
