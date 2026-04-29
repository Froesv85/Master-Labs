# Cronograma Diário — Maio 2026
> MakerConnect TCC | Branch: v.002 | Atualizado: 29/04/2026

**Gates críticos:** S1.2 em 13/05 · S1.3 em 27/05 (go/no-go para Junho)

---

## Legenda
- [ ] Pendente
- [x] Concluído
- [~] Em progresso
- [s] Pulado / adiado

---

## Semana 1 — 29 Abr → 04 Mai
**Foco: Audit Trail LGPD + Botão Join (Frontend)**

### Quarta 29/04
- [x] Criar modelo `LgpdAuditLog` no `prisma/schema.prisma`
  - campos: `id`, `createdAt`, `action`, `projectId`, `userId`, `piiTypes`, `redactions`, `context`
- [x] Rodar `npx prisma migrate dev --name add_lgpd_audit_log`
- [x] Criar `lib/lgpd-audit.ts` — função `createLgpdAuditLog()`
- [x] Integrar no `app/api/projects/[id]/extract/callback/route.ts`
  - anonymiza PII do output antes de salvar
  - grava audit log apenas em status `done`
- [x] Testes: 10 testes no callback (PII + audit) · suite total 145 / 0 falhas

### Quinta 30/04
- [x] Criar `GET /api/lgpd/audit` — listagem de logs (auth obrigatória)
  - filtros: `?projectId=` · `?userId=` · `?page=` · `?limit=`
- [x] Testes: 6 testes (401, listagem, filtro projectId, filtro userId, 400 inválido, paginação)
- [x] Smoke test manual: chamar callback e verificar log no banco

### Sexta 01/05 — Feriado do Trabalho
- [s] Dia de folga — sem desenvolvimento planejado

### Sábado 02/05
- [x] Escrever testes para `lib/lgpd-audit.ts` — antecipado em 30/04
  - 5 testes: campos completos, JSON de piiTypes, array vazio → null, campos opcionais → null, retorno do create

### Domingo 03/05
- [ ] Buffer / descanso

### Segunda 04/05
- [x] **Frontend:** botão Join/Solicitar em `app/(app)/communities/[id]/page.tsx`
  - `POST /api/communities/[id]/members`
  - 4 estados: **Entrar** · **Solicitar adesão** (privada) · **Solicitação enviada** (pending) · **Membro**
  - founder/moderator: sem botão (só badge de role)
  - optimistic update ao entrar — sem reload de página
- [x] Badge público/privado no hero da comunidade
- [x] Sessão detectada via `/api/auth/me` — botão só aparece para usuários logados
- [x] Aba Membros mostra apenas `status=approved`

---

## Semana 2 — 05 → 11 Mai
**Foco: Frontend Comunidades — Posts, Upload e Aprovação**

### Terça 05/05
- [x] **Frontend:** Modal de criação de post em `[id]/page.tsx`
  - campos: título + conteúdo (validação client-side)
  - chama `POST /api/communities/[id]/posts`
  - botão "Novo Post" visível só para membros aprovados (member/mod/founder)
- [x] Optimistic update — novo post aparece no topo sem reload

### Quarta 06/05
- [x] **Frontend:** Upload de imagem no modal de post
  - aceita: jpeg · png · gif · webp · max 5 MB (validação client-side)
  - preview da imagem antes de enviar + botão de remover
  - converte para base64 via FileReader → envia `mediaB64` + `mediaContentType`
  - card de post exibe imagem inline quando `mediaUrl` presente

### Quinta 07/05
- [x] **Frontend:** UI de aprovação de membros pendentes
  - aba "Pendentes" visível apenas para founder/mod (destaque violet)
  - fetch lazy ao abrir a aba — `GET ?status=pending`
  - botões Aprovar (teal) / Rejeitar (red) por membro
  - `PATCH /api/communities/[id]/members/[userId]` → remove da lista imediatamente

### Sexta 08/05
- [x] **Frontend:** Badge público/privado no header da comunidade — antecipado em 04/05
- [x] **Frontend:** Exibir `mediaUrl` nos cards de post (imagem inline) — antecipado em 06/05
- [x] Polimento visual — layout mobile do hero corrigido (stats+botão em row no mobile, column no sm+)

### Sábado 09/05
- [x] Testes audit trail — 18 testes em 3 suites (lib/lgpd, lib/lgpd-audit, api/lgpd-audit)
- [x] Suite completa: 156 testes / 22 suites / 0 falhas
- [ ] Commit e push branch v.002

### Domingo 10/05
- [ ] Buffer / descanso

### Segunda 11/05
- [ ] Review geral do frontend de comunidades
- [ ] Corrigir bugs encontrados durante uso manual
- [ ] Atualizar Jira — fechar tickets do frontend de comunidades

---

## Semana 3 — 12 → 18 Mai
**Foco: Gate S1.2 + Início da Instrumentação S1.3**

### Terça 12/05 — Véspera do Gate S1.2
- [ ] Checklist E2E pipeline: `input → anonymize → embed → retrieve → output`
- [ ] Verificar que `LgpdAuditLog` está sendo gravado em cada chamada
- [ ] Verificar `/api/lgpd/audit` retornando logs reais
- [ ] Rodar suite completa: `npx jest` — 0 falhas obrigatório
- [ ] Documentar resultado E2E (latência, tokens, resultado)

### Quarta 13/05 — GATE S1.2
- [ ] **Gate S1.2 — Critérios de aprovação:**
  - [ ] Pipeline completo funcionando E2E
  - [ ] PII detection + redaction ativo
  - [ ] Audit trail gravando corretamente
  - [ ] 0 falhas na suite de testes
- [ ] Atualizar Jira — ML-95 e tickets S1.2 → Concluído
- [ ] Commit de encerramento S1.2

> **Resultado Gate S1.2:** _______________  
> **Data/hora:** _______________

### Quinta 14/05
- [ ] Início S1.3: planejar pontos de instrumentação de latência
- [ ] Criar middleware de timing no pipeline
  - medir: `extractStart → n8nCallback → anonymize → embed → retrieve → done`

### Sexta 15/05
- [ ] Implementar coleta de métricas `p50` / `p95` de latência
- [ ] Salvar métricas no banco (novo model `PipelineMetric` ou via log estruturado)
- [ ] Primeiro smoke test de latência com projeto real

### Sábado 16/05
- [ ] Buffer

### Domingo 17/05
- [ ] Buffer

### Segunda 18/05
- [ ] Analisar primeiros dados de latência coletados
- [ ] Identificar gargalos (Pinecone? Ollama? n8n?)
- [ ] Anotar baseline: `p50=___ms · p95=___ms`

> **Baseline de latência (18/05):** p50 = ___ ms | p95 = ___ ms | Meta: < 15 000 ms

---

## Semana 4 — 19 → 25 Mai
**Foco: RAG Quality Eval — meta ≥ 85% relevance**

### Terça 19/05
- [ ] Preparar holdout dataset — 10 projetos IoT variados
- [ ] Criar script de RAG quality eval (`scripts/rag-eval.ts` ou `.js`)
  - input: query → RAG → resposta → score manual ou heurístico

### Quarta 20/05
- [ ] Rodar RAG quality eval — primeira rodada completa
- [ ] Registrar scores por projeto
- [ ] Calcular média de relevance

> **RAG Eval Rodada 1 (20/05):** relevance = ___% | Meta: ≥ 85%

### Quinta 21/05
- [ ] Analisar casos com score < 80%
- [ ] Identificar causa: prompt fraco? embedding ruim? chunk size?
- [ ] Decisão: ajustar prompt n8n vs reindexar com parâmetros diferentes

### Sexta 22/05
- [ ] Aplicar tuning (prompt / chunk / model params)
- [ ] Rodar eval novamente

> **RAG Eval Rodada 2 (22/05):** relevance = ___% | Meta: ≥ 85%

### Sábado 23/05
- [ ] Buffer / rerun eval se necessário

### Domingo 24/05
- [ ] Buffer

### Segunda 25/05
- [ ] Dashboard de métricas — `GET /api/admin/metrics`
  - retorna: `{ p50, p95, avgRelevance, totalRuns, lastRunAt }`
- [ ] Página `/admin/metrics` no frontend (básico — tabela + valores)

---

## Semana 5 — 26 → 31 Mai
**Foco: Gate S1.3 + Encerramento de Maio**

### Terça 26/05 — Véspera do Gate S1.3
- [ ] Dashboard frontend com visualização de latência e relevance
- [ ] Rodar suite completa — 0 falhas
- [ ] Rodar RAG eval final — confirmar ≥ 85%
- [ ] Medir latência E2E — confirmar p95 < 15 000 ms

### Quarta 27/05 — GATE S1.3 (CRÍTICO)
- [ ] **Gate S1.3 — Critérios obrigatórios:**
  - [ ] RAG relevance ≥ 85%
  - [ ] Latência p95 < 15 000 ms
  - [ ] Dashboard mostrando métricas reais
  - [ ] 0 falhas na suite de testes
- [ ] Atualizar Jira — tickets S1.3 → Concluído
- [ ] **Decisão Go/No-Go para Junho (S1.4 + S2):** _______________

> **Resultado Gate S1.3:** _______________  
> **RAG relevance final:** ___%  
> **Latência p95 final:** ___ ms  
> **Go/No-Go:** _______________

### Quinta 28/05
- [ ] Fechar todos os tickets abertos de maio no Jira
- [ ] Commit final de encerramento do mês

### Sexta 29/05
- [ ] Atualizar `docs/planning/cronograma-sprint-detalhado.md` com status real de maio
- [ ] Anotar o que foi adiado ou antecipado

### Sábado 30/05
- [ ] Buffer

### Domingo 31/05 — Retrospectiva Maio
- [ ] Preencher resumo abaixo
- [ ] Planejar ajustes para Junho (S1.4 + S2.0)

---

## Retrospectiva Maio

> Preencher em 31/05/2026

| Métrica | Planejado | Real |
|---------|-----------|------|
| Gate S1.2 | 13/05 PASS | ___ |
| Gate S1.3 | 27/05 PASS | ___ |
| RAG relevance | ≥ 85% | ___% |
| Latência p95 | < 15 000 ms | ___ ms |
| Testes totais | > 160 | ___ |
| Tickets Jira fechados | ~12 | ___ |

**O que funcionou bem:**

**O que atrasar / bloqueou:**

**Ajustes para Junho:**
