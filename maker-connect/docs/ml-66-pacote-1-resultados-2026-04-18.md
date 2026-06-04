# ML-66 - Pacote 1 (Prompt v2 + Schema Unico)

Data: 2026-04-18
Objetivo: aplicar prompt v2 com schema unico e medir baseline vs v2.

## 1) Entregas implementadas

### 1.1 Schema unico no backend
- Novo normalizador de output: `lib/extraction-output-schema.ts`
- Schema padrao: `mc_extract_v2`
- Campos normalizados:
  - `technicalRequirements[]` com `id`, `name`, `detail`, `priority`
  - `suggestedBOM[]` com `item`, `quantity`, `notes`
  - `suggestedCode` (string)
  - `confidenceScore` (0..100)

### 1.2 Callback alinhado ao schema
- `app/api/projects/[id]/extract/callback/route.ts` agora normaliza output antes de persistir.

### 1.3 Consumo frontend/export alinhado
- `extract-panel.tsx` atualizado para renderizar `name/detail/priority`.
- `export/route.ts` atualizado para priorizar campo `detail`.

### 1.4 Workflow v2 de referência
- Novo artefato n8n: `docs/n8n-workflow-v3-rag-ollama-v2-ml66.json`

### 1.5 Benchmark comparativo
- Script: `scripts/benchmark-prompt-v2.mjs`
- Artefatos gerados:
  - `docs/ml-66-benchmark-baseline-vs-v2.json`
  - `docs/ml-66-benchmark-baseline-vs-v2.md`

## 2) Resultado baseline vs v2 (rodada inicial)

| Métrica | Baseline | v2 | Delta |
|---|---:|---:|---:|
| Parse valid (%) | 100 | 25 | -75 |
| Schema valid (%) | 100 | 25 | -75 |
| P50 latency (ms) | 21941 | 25880 | +3939 |
| P95 latency (ms) | 22795 | 28770 | +5975 |
| Relevance proxy (%) | 100 | 25 | -75 |

Leitura técnica:
- O prompt v2 atual ficou **over-constrained** para o modelo/local runtime.
- O schema único funcionou no backend, mas a geração ficou instável no LLM com o conjunto de regras duras.
- Latência aumentou devido ao prompt maior e instruções mais rígidas.

## 3) Conclusão do pacote 1

Status ML-66: **parcial**
- ✅ Infra de schema único implementada e integrada (backend + UI + export)
- ✅ Harness de benchmark baseline/v2 pronto
- ❌ Prompt v2 inicial não aprovado (queda significativa de parse/schema validity)

## 4) Próximo ajuste (v2.1 recomendado)

1. Reduzir rigidez textual do prompt mantendo schema essencial.
2. Mudar estratégia: pedir JSON mínimo obrigatório e deixar defaults para normalizador backend.
3. Incluir um único exemplo curto de output válido (few-shot leve).
4. Reexecutar benchmark e comparar contra baseline da rodada inicial.

Critério para avançar ML-66:
- Parse >= 95%
- Schema valid >= 95%
- Relevance proxy >= baseline - 10pp (sem regressão severa)
- Latência com impacto controlado
