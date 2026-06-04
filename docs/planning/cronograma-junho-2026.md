# Cronograma Diário — Junho 2026
> MakerConnect TCC | Branch: v.002 | Criado: 04/06/2026

**Contexto de entrada:** Gate S1.3 partial PASS (relevance 98% ✅, latência ⚠️ sem GPU).  
**Foco do mês:** PDF Export assíncrono (Semana 7-8) + E2E completo + decisão infra GPU (até 15/06).

**Gates críticos:** S1.4 em 25/06 (PDF operacional) · Decisão GPU/Infra até 15/06

---

## Legenda
- [ ] Pendente
- [x] Concluído
- [~] Em progresso
- [s] Pulado / adiado

---

## Semana 7 — 04 → 10 Jun
**Foco: BullMQ + PDF Generation (backend)**

### Quarta 04/06 — Kickoff Junho
- [x] Auditoria Jira — fechar tickets atrasados e Sprint 0
- [x] Retrospectiva maio preenchida
- [x] Suite de testes: 174 / 0 falhas — validado ✅
- [x] Dev server rodando em localhost:3000 ✅
- [ ] Iniciar implementação BullMQ queue para PDF export

### Quinta 05/06
- [ ] Criar `lib/pdf-queue.ts` — BullMQ producer
  - `addExportJob(projectId, userId)` → retorna `jobId`
  - conexão Redis via `ioredis` (já em deps)
- [ ] Criar `workers/pdf-worker.ts` — BullMQ consumer
  - processa jobs `queued → processing → done | failed`
  - persiste `fileUrl` e `status` em `ProjectExport`
- [ ] Migration se necessário — verificar modelo `ProjectExport` existente

### Sexta 06/06
- [ ] Implementar geração do PDF com `pdfkit`
  - `lib/pdf-generator.ts`: cover + summary + BOM + requirements + LGPD footer
  - input: `Project` + `ProjectExtractionLog` (output do RAG)
  - output: `Buffer` para upload S3
- [ ] Upload do PDF para S3/MinIO via `lib/s3-service.ts`
- [ ] Integrar no worker: PDF gerado → upload → `fileUrl` salvo

### Sábado 07/06
- [ ] Testes unitários para `lib/pdf-generator.ts`
  - gera Buffer não-vazio
  - inclui título do projeto
  - inclui seção LGPD
- [ ] Testes de integração para queue (`lib/pdf-queue.ts`)
  - job adicionado com `jobId` retornado
  - worker processa e atualiza status

### Domingo 08/06
- [ ] Buffer / descanso

### Segunda 09/06
- [ ] `POST /api/projects/[id]/export` — enfileira job, retorna `{ jobId, status: "queued" }`
- [ ] `GET /api/projects/[id]/export` — polling de status por jobId
- [ ] Smoke test manual: `POST → queued → processing → done`

---

## Semana 8 — 11 → 17 Jun
**Foco: Export History UI + E2E + Decisão Infra**

### Terça 10/06
- [ ] Frontend: botão "Exportar PDF" na página do projeto
  - `POST /api/projects/[id]/export` → inicia job
  - polling a cada 3s via `GET /api/projects/[id]/export`
  - estados: Gerando... / Pronto (link download) / Erro (retry)

### Quarta 11/06
- [ ] Frontend: página `/projects/[id]/export` — histórico de exports
  - lista: data · status · link download (se done) · erro (se failed)
  - botão "Gerar novo PDF" no topo
- [ ] Empty state quando sem exports anteriores

### Quinta 12/06
- [ ] E2E tests (15+):
  - POST cria job com status `queued`
  - GET poll retorna status correto
  - Worker processa job → `done`
  - PDF gerado é válido (Buffer > 0)
  - Histórico de exports listado corretamente
  - 401 sem autenticação

### Sexta 13/06
- [ ] **Decisão de Infra (GPU)** — registrar em `docs/ai/decisao-infra-junho-2026.md`:
  - KVM 2 vs KVM 4 (comparativo custo/performance)
  - Gemini API vs Ollama 7B local
  - Critério de decisão: latência p95 < 15 000 ms com budget TCC

### Sábado 14/06
- [ ] Polimento visual do fluxo de export
- [ ] Review code completo da feature

### Domingo 15/06
- [ ] Buffer / retrospectiva parcial da semana
- [ ] **Deadline: Decisão GPU/Infra tomada e registrada**

---

## Semana 9 — 18 → 24 Jun
**Foco: E2E Flows Completos + Prep Gate S1.4**

### Segunda 18/06
- [ ] E2E flow: Feed → abrir projeto → Extract IA → Exportar PDF
- [ ] Error handling global: retry automático em job failed
- [ ] Logging estruturado em todas as etapas do export

### Terça 19/06
- [ ] Load test leve: 10 exports simultâneos → sem crash
- [ ] Verificar Redis connection pool em alta carga

### Quarta 20/06
- [ ] Implementar GPU / nova infra (se decisão KVM4)
  - atualizar `OLLAMA_HOST` nas variáveis de ambiente
  - rodar RAG eval novamente com GPU → confirmar p50/p95
- [ ] OU: migrar para Gemini API e ajustar `lib/ollama.ts`

### Quinta 21/06
- [ ] Medir latência E2E com nova infra:
  - `anonymizeMs + n8nTriggerMs + llmMs + embeddingMs`
  - registrar: p50 = ___ ms | p95 = ___ ms
- [ ] Confirmar: p95 < 15 000 ms ✅/❌

### Sexta 22/06
- [ ] Rodar suite completa — 0 falhas
- [ ] Rodar RAG eval holdout — confirmar ≥ 85%
- [ ] Review docs: atualizar `README.md` com instrução de PDF export

### Sábado 23/06
- [ ] Buffer

### Domingo 24/06 — Véspera Gate S1.4
- [ ] Checklist completo Gate S1.4:
  - PDF export funcionando E2E ✓/✗
  - p95 < 15 000 ms ✓/✗
  - 0 falhas nos testes ✓/✗
  - Histórico de exports na UI ✓/✗

---

## Semana 10 — 25 Jun → 01 Jul
**Foco: Gate S1.4 + Planejamento Julho**

### Quarta 25/06 — GATE S1.4
- [ ] **Gate S1.4 — Critérios obrigatórios:**
  - [ ] PDF export queued → done funcionando E2E
  - [ ] Latência p95 < 15 000 ms (com GPU/nova infra)
  - [ ] RAG relevance ≥ 85%
  - [ ] 0 falhas na suite de testes
- [ ] Atualizar Jira — ML-5, ML-6 → Concluído

> **Resultado Gate S1.4:** _______________  
> **Latência p95 (nova infra):** ___ ms  
> **Go/No-Go para Julho (Auth E2E + Polish):** _______________

### Quinta 26/06
- [ ] Fechar tickets abertos de junho no Jira
- [ ] Commit de encerramento da semana

### Sexta 27/06
- [ ] Planning para julho: Auth E2E + UI Polish + C4 diagram
- [ ] Atualizar cronograma com retrospectiva de junho

---

## Retrospectiva Junho

> Preencher em 01/07/2026

| Métrica | Planejado | Real |
|---------|-----------|------|
| Gate S1.4 | 25/06 PASS | ___ |
| PDF Export E2E | funcionando | ___ |
| Latência p95 | < 15 000 ms | ___ ms |
| Decisão GPU/Infra | até 15/06 | ___ |
| Testes totais | > 190 | ___ |
| Tickets Jira fechados | ~8 | ___ |

**O que funcionou bem:**

**O que atrasou / bloqueou:**

**Ajustes para Julho:**
