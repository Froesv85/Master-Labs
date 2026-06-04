# 🎓 ESTRATÉGIA EXECUTIVA - MAKERCONNECT TCC
## Trabalho Semanal Estruturado para Excelência Acadêmica
**Estudante**: Vinicius Froes (7º Sem - Engenharia de Software)  
**Universidade**: CATOLICASC - Jaraguá do Sul  
**Objetivo**: Projeto 100% Funcional + Excelência em Documentação  
**Deadline**: Novembro 2026 (26 semanas disponíveis)  
**Estratégia**: Semanal + Qualidade + Banca

---

## 📋 CONTEXTO DO SEU PROJETO (TCC)

### O que a Banca vai Avaliar 🎯

| Critério | Peso | O que significa |
|----------|------|-----------------|
| **Funcionalidade** | 20% | Features funcionam conforme especificado |
| **Código Limpo** | 15% | Arquitetura, design patterns, legibilidade |
| **Documentação** | 20% | README, ADR, API docs, decisões técnicas |
| **Testes** | 15% | Unit tests, integration tests, coverage >70% |
| **UX/Design** | 10% | Interface funcional e bem organizada |
| **Apresentação** | 15% | Pitch, demo, respostas técnicas na banca |
| **Inovação** | 5% | Uso de tecnologias interessantes (RAG, n8n, etc) |

**Total**: 100% = Nota Final

### Seu Diferencial 🌟
- RAG com AI (não é comum em TCCs)
- Pipeline n8n (inovação)
- LGPD compliance (mostra maturidade)
- Social networking (maker community)
- PDF export com trilha auditável (diferencial)

---

## 🗓️ CALENDÁRIO ESTRATÉGICO

### Macro Timeline (26 semanas até Nov)

```
Fase 1: FOUNDATION (Semanas 1-6, até ~23 Maio)
└─ Sprint 0: Infrastructure
└─ Sprint 1A: RAG Pipeline (com Phase 2 tuning)
└─ Sprint 1B: Feed UI
Target: RAG ≥85% quality, Feed básico + API

Fase 2: MVP (Semanas 7-14, até ~07 Julho)
└─ Phase 2: LLM Optimization paralelo
└─ Sprint 2A/2B: Integration + Fork
└─ Sprint 3A/3B: PDF Export
Target: MVP FUNCIONAL + testes

Fase 3: POLISH (Semanas 15-20, até ~11 Agosto)
└─ Sprint 4: E2E flows + UX refinement
└─ Sprint 5: Hardening + monitoring
└─ Documentação completa (README, ADR, API docs)
Target: Código pronto para banca

Fase 4: DEMO PREP (Semanas 21-26, até Novembro)
└─ Testes intensivos (unit + integration + e2e)
└─ Performance tuning
└─ Banca presentation prep
└─ Video demo + slides
Target: 100% pronto para apresentação
```

---

## 📊 MODELO DE TRABALHO SEMANAL

### Estrutura Proposta: **Weekly Sync + Deliverables**

Vou propor trabalharmos assim:

#### **SEGUNDA (Kickoff)**
- ☀️ **Sessão: 30min** (Cowork)
- Revisar sprint anterior (o que foi feito + o que não)
- Definir metas da semana (3-5 tarefas concretas)
- Identificar blockers
- **Deliverable esperado nesta semana**: [TBD por sprint]

#### **QUARTA (Mid-week Check)**
- ☀️ **Sessão: 20min** (Cowork ou async no chat)
- Status quick: "Sigo on-track?"
- Resolver any blockers que apareceram
- Ajustar prioridades se necessário

#### **SEXTA (Review + Planning)**
- ☀️ **Sessão: 60min** (Cowork)
- Demo do trabalho (screenshot, código, testes)
- Code review + feedback técnico
- Documentação update (README, ADR, decision logs)
- Planning para semana que vem
- **Artefato gerado**: Weekly report (1 página, métricas)

#### **DOMINGO (Auto-Sync)**
- 📝 Você escreve: O que fiz + o que falta + riscos identificados
- Isso fica como "input" para segunda
- ~15 min de reflexão

---

## 🎯 CADA SEMANA TEM SAÍDA ESPECÍFICA

### Fase 1: FOUNDATION (Semanas 1-6)

#### Semana 1 (23-29 Abril)
**Meta**: Sprint 0 finalizar, S1B iniciar  
**Deliverables**:
- [ ] API `/api/projects` endpoint 100% funcional
- [ ] React Feed page renderizando (com mock data)
- [ ] GitHub Actions CI/CD passando
- [ ] README v1.0 com setup instructions
- [ ] Video demo (5 min): "Aqui está a feed funcionando"

**Testando**: Unit tests em 2 endpoints

---

#### Semana 2 (30 Abr - 06 Mai)
**Meta**: S1B Feed + Filter UI done, S1A RAG tuning iniciando  
**Deliverables**:
- [ ] Feed filter by category working (UI + API)
- [ ] Pagination implemented (10 projects/page)
- [ ] Vote button (UI + backend logic)
- [ ] GPU setup completed (CUDA + LLM model)
- [ ] Prompt engineering experiment 1 (relevance baseline)

**Testing**: 10 unit tests (Feed endpoints)

---

#### Semana 3 (07-13 Mai)
**Meta**: RAG tuning progress, Fork logic started  
**Deliverables**:
- [ ] Prompt version 2-3 tested (A/B testing)
- [ ] RAG relevance improved (47% → 60%+?)
- [ ] Fork endpoint `/api/projects/{id}/fork` done
- [ ] Fork UI button + modal done
- [ ] Integration test: Feed → Fork flow

**Testing**: 8 integration tests

---

#### Semana 4 (14-20 Mai)
**Meta**: RAG tunning final push, Phase 2 complete goal  
**Deliverables**:
- [ ] RAG relevance ≥85% ACHIEVED 🎉
- [ ] RAG latency <15s P95 ACHIEVED 🎉
- [ ] Benchmark test passed (ML-57 DONE)
- [ ] Profile page (read-only, name + projects)
- [ ] ADR document: "RAG Tuning Decisions"

**Testing**: Benchmark suite passing

---

#### Semana 5 (21-27 Mai)
**Meta**: S2A Integration start, Feed + RAG merged  
**Deliverables**:
- [ ] Feed endpoint returns REAL RAG-scored projects
- [ ] Relevance score displayed in UI
- [ ] Integration tests: Feed → RAG → API
- [ ] Profile page showing lineage (parent projects)
- [ ] Performance dashboard (basic metrics)

**Testing**: E2E test: Feed → Search → View Profile

---

#### Semana 6 (28 Mai - 03 Jun)
**Meta**: S3A PDF infrastructure ready  
**Deliverables**:
- [ ] Job queue (BullMQ) setup done
- [ ] PDF worker generating basic PDFs
- [ ] Export endpoint `/api/projects/{id}/export`
- [ ] Export status tracking (queued → processing → done)
- [ ] Redis + worker process running

**Testing**: Job queue unit tests, PDF generation tests

---

### Fase 2: MVP (Semanas 7-14)

#### Semana 7 (04-10 Jun)
**Meta**: PDF template + export UI  
**Deliverables**:
- [ ] PDF template done (BOM + requirements + signature block)
- [ ] Export history page (list of exports)
- [ ] Download link working
- [ ] Status polling working (real-time updates)
- [ ] All E2E flows passing

**Testing**: 15 E2E tests

---

#### Semana 8-10 (11 Jun - 01 Jul)
**Meta**: Full MVP ready  
**Deliverables**:
- [ ] Authentication (JWT) working
- [ ] User session management
- [ ] Error pages (404, 500, etc)
- [ ] Mobile responsiveness check
- [ ] Load testing (100 req/s stable?)
- [ ] Security audit (CORS, LGPD headers)

**Testing**: Full MVP test suite (30+ tests)

---

#### Semana 11-14 (02 Jul - 29 Jul)
**Meta**: MVP documentation + polish  
**Deliverables**:
- [ ] Auto-generated API docs (OpenAPI/Swagger)
- [ ] Architecture ADR complete (10+ decisions)
- [ ] README with examples
- [ ] Deployment guide
- [ ] Tech debt identified and documented
- [ ] Demo video (10 min): "MakerConnect MVP"

---

### Fase 3: POLISH (Semanas 15-20)

#### Semana 15-17 (30 Jul - 20 Ago)
**Meta**: Code quality + test coverage  
**Deliverables**:
- [ ] Unit test coverage >80%
- [ ] Integration test coverage >70%
- [ ] Code review checklist passed
- [ ] ESLint + Prettier all green
- [ ] Type safety (TypeScript strict mode)
- [ ] Performance optimization (Lighthouse >80)

---

#### Semana 18-20 (21 Ago - 10 Set)
**Meta**: Banca-ready documentation  
**Deliverables**:
- [ ] CLAUDE.md (architecture overview for AI mentors)
- [ ] DECISIONS.md (all major decisions + rationale)
- [ ] TESTING.md (how to run tests)
- [ ] DEPLOYMENT.md (production checklist)
- [ ] TROUBLESHOOTING.md (common issues)
- [ ] Banca presentation slides (20-30 slides)
- [ ] 1-minute pitch video

---

### Fase 4: DEMO PREP (Semanas 21-26)

#### Semana 21-22 (11-24 Set)
**Meta**: Presentation rehearsal  
**Deliverables**:
- [ ] Live demo script (5 min with backup)
- [ ] Presentation slides reviewed + approved
- [ ] Technical Q&A prep (likely questions doc)
- [ ] Repository final cleanup
- [ ] All secrets/keys removed from repo

---

#### Semana 23-26 (25 Set - 08 Nov)
**Meta**: Banca preparation  
**Deliverables**:
- [ ] Dress rehearsal with mentors
- [ ] Answer practice questions (10+)
- [ ] Video demo published (YouTube unlisted)
- [ ] Final code review
- [ ] Project summary (1 page, PDF)
- [ ] Ready for banca! 🎓

---

## 📈 SPRINT VELOCITY + METRICS

### Tracking Semanal

Vou propor trackear isso:

```
Semana X:
┌─────────────────────────────────────┐
│ WEEKLY REPORT (Sexta)               │
├─────────────────────────────────────┤
│ 📊 METRICS                          │
│  • Story Points Completed: X/8 SP   │
│  • Tests Added: X tests             │
│  • Code Coverage: X%                │
│  • Bugs Found & Fixed: X            │
│                                     │
│ ✅ COMPLETED TASKS                  │
│  • Task 1: [feature]                │
│  • Task 2: [feature]                │
│  • Task 3: [testing]                │
│                                     │
│ 🚧 IN PROGRESS                      │
│  • Task 4: [blocker reason]         │
│                                     │
│ 📝 DOCUMENTING                      │
│  • ADR: [decision title]            │
│  • README: [section updated]        │
│                                     │
│ 🔴 BLOCKERS IDENTIFIED              │
│  • [Blocker 1] → Action: [X]        │
│                                     │
│ 📈 VELOCITY TREND                   │
│  This week: 7 SP                    │
│  3-week avg: 6.5 SP                 │
│  Trend: ↑ Improving                 │
│                                     │
│ 🎯 NEXT WEEK GOAL                   │
│  • [3-5 items with priorities]      │
└─────────────────────────────────────┘
```

---

## 🏆 QUALIDADE MÍNIMA ESPERADA (TCC Excellência)

### Code Quality
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier enforced
- ✅ No console.log in production
- ✅ Error handling on every endpoint
- ✅ Input validation everywhere

### Testing
- ✅ Every feature has unit test
- ✅ All API endpoints tested
- ✅ E2E happy path tested
- ✅ Test coverage >75%

### Documentation
- ✅ README with setup + examples
- ✅ API docs (auto-generated or manual)
- ✅ Architecture Decision Records (ADR)
- ✅ Comments on complex logic
- ✅ Deployment guide

### Security
- ✅ No secrets in repo
- ✅ CORS configured properly
- ✅ SQL injection prevention (Prisma ORM)
- ✅ LGPD compliance (PII masked)
- ✅ Rate limiting on API

### Performance
- ✅ API endpoints <100ms response
- ✅ PDF export <5 min
- ✅ Frontend Lighthouse >80
- ✅ Database queries indexed
- ✅ No memory leaks

---

## 🛠️ FERRAMENTAS QUE VAMOS USAR

### 1️⃣ Cowork (Weekly Syncs)
- Segunda 15:00: Sprint planning (30 min)
- Quarta 14:00: Quick check (20 min)
- Sexta 14:00: Demo + Review (60 min)

### 2️⃣ GitHub (Code)
- Branch strategy: `feature/x`, `fix/x`
- PR reviews antes de merge (mesmo sendo solo, prática boa)
- Squash commits (história limpa)
- Tagging releases (v0.1, v0.2, etc)

### 3️⃣ Jira (Tracking)
- Sprints de 1 semana (alinhado com nosso sync)
- Story points realistas (não inflate)
- Tasks bloqueadas identificadas ASAP
- Burndown chart visível

### 4️⃣ This Cowork Session
- Vamos usar `TaskCreate` para cada semana
- Vou monitorar bloqueadores
- Vou fazer code reviews
- Vou garantir qualidade

---

## 💡 ESTRATÉGIA ESPECIAL: "BANCA MINDSET"

### Perspectiva da Banca (Pense assim)

Quando a banca avaliar, ela vai pensar:

> "Este estudante entende o problema? Sabia arquitetar bem? 
> Consegue defender suas decisões? Código é limpo e mantível?
> Documentação permite que outro dev continue o projeto?"

### Isso Significa

1. **Cada decision precisa ter motivo**
   - Por que Next.js? (não é "porque sim")
   - Por que Prisma? (trade-offs vs alternatives)
   - Por que n8n? (problema que resolve)

2. **Código precisa contar uma história**
   - Naming claro (não `x`, `y`, `temp`)
   - Functions pequenas (< 20 linhas)
   - Comments explicam "por quê", não "o quê"

3. **Testes são evidência**
   - "Este endpoint funciona?" → Test prova
   - "Esta lógica é correta?" → Test garante

4. **Documentação é esperada**
   - README: Como rodar
   - ADR: Decisões técnicas
   - API docs: Como usar
   - Troubleshooting: Common issues

---

## 📅 ESTRUTURA NOSSA (Semanal)

### SEG - KICK-OFF (30 min)
```
09:00-09:30 | Conversa síncrona (Cowork)
├─ O que ficou pendente?
├─ Que foi feito no fim de semana?
├─ Quais 3-5 tarefas essa semana?
├─ Quais são os riscos/blockers?
└─ Confirm: Pronto para coder?
```

### QUA - CHECK (20 min, async ou síncrono)
```
14:00-14:20 | Rápido
├─ "Sigo no caminho?"
├─ Algo bloqueou?
└─ Preciso de ajuda?
```

### SEX - REVIEW (60 min)
```
14:00-15:00 | Demo + Feedback
├─ Demo: O que ficou pronto?
├─ Code: Qualidade OK?
├─ Tests: Coverage adequado?
├─ Docs: README/ADR updated?
├─ Feedback técnico
└─ Planning próxima semana
```

### DOM - AUTO-SYNC (15 min)
```
Você escreve no chat:
├─ O que fiz
├─ O que falta
├─ Riscos encontrados
└─ Perguntas para segunda
```

---

## 🎓 META FINAL PARA BANCA

Quando chegar em Novembro, você vai ter:

✅ **Projeto 100% Funcional**
- MVP completo
- RAG com 85%+ relevance
- PDF export funcionando
- All features testadas

✅ **Código Excelente**
- Clean code principles
- Design patterns aplicados
- Type-safe (TypeScript)
- Test coverage >75%

✅ **Documentação Completa**
- README profissional
- 10+ ADRs (decisões técnicas)
- API documentation
- Deployment guide
- Troubleshooting guide

✅ **Pronto para Banca**
- Presentation slides
- Live demo (backup plan)
- Q&A preparation
- Video demo (YouTube)

✅ **Repositório Limpo**
- No secrets exposed
- Good commit history
- Meaningful branches
- Release tags

---

## 🚀 COMEÇAMOS AGORA?

Vou propor assim:

### **ESTA SEMANA (23-29 Abril)**

**META**: Sprint 0 finalizar, Sprint 1B kick-off

**Deliverables**:
- [ ] API `/api/projects` 100% done (GET com filtro)
- [ ] Feed page UI (básico, mock data)
- [ ] GitHub Actions CI/CD green
- [ ] 5+ unit tests passing
- [ ] README v1.0 com setup instructions

**Sexta (26 Abril)**: Demo + review tudo junto

---

## 📊 CHECKLIST PARA VOCÊ CONFIRMAR

- [ ] Entendi o calendário (26 semanas até Nov)
- [ ] Faz sentido a estrutura semanal (Seg/Qua/Sex)?
- [ ] Concordo com 30min Seg + 20min Qua + 60min Sex?
- [ ] Pronto para entregar qualidade (não só funciona)?
- [ ] Quer começar **SEGUNDA 22 ABRIL**?

---

**Nota Final**: Isso é VIÁVEL. Você tem tempo, tem plano claro, vai ter suporte semanal. O diferencial do TCC é a **qualidade + documentação**, não só features. Vamos focar nisso.

**Vamos começar segunda? 🚀**
