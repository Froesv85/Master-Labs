# ML-57 Benchmark Final (pos T1-T3) - 2026-04-19

## Escopo
Consolidacao final dos experimentos da trilha Phase 2 executados no dia:
- T1: comparativo de modelo local (qwen2.5:7b-instruct vs llama3.1:8b)
- T2: prompt v3 + harness de 10 casos
- T3: retrieval/context pruning com comparativo broad vs pruned

## Evidencias utilizadas
- maker-connect/docs/ml-57-benchmark-qwen2.5-7b-instruct-2026-04-19.json
- maker-connect/docs/ml-57-benchmark-llama3.1-8b-2026-04-19.json
- maker-connect/docs/ml-66-prompt-v3-validation-10cases-2026-04-19.json
- maker-connect/docs/ml-67-retrieval-pruning-validation-10cases-2026-04-19.json

## Resultado consolidado

### T1 - Modelo
- qwen2.5:7b-instruct: parse/schema 100%, p50 29.729s, p95 29.804s, relevancia 100% (benchmark v2 local).
- llama3.1:8b: parse/schema 100%, p50 26.380s, p95 26.909s, relevancia 81.25%.

Leitura:
- troca de modelo sozinha reduz parte da latencia, mas nao fecha gate de relevancia + latencia para demo.

### T2 - Prompt v3 (10 casos)
- parse 100%
- schema 90%
- p50 27.390s
- p95 37.478s
- relevancia 72.5%

Leitura:
- parse estabilizado, mas schema e relevancia abaixo do gate alvo.

### T3 - Retrieval pruning (10 casos)
- broad: parse 100%, schema 80%, p50 30.068s, p95 37.823s, relevancia 70%, contexto medio 572 chars.
- pruned: parse 100%, schema 90%, p50 28.187s, p95 36.423s, relevancia 72.5%, contexto medio 241 chars.
- delta pruned vs broad: +10pp schema, +2.5pp relevancia, -1.881s p50, -1.400s p95, -331 chars de contexto.

Leitura:
- pruning melhorou qualidade estrutural e custo de contexto sem regressao de latencia.

## Decisao T4 (GO/NO-GO)
- Parse success (>=95%): GO.
- Schema valid (>=95%): NO-GO (90% no melhor caso atual).
- Relevancia media (>=85%): NO-GO (72.5% no melhor caso atual).
- Latencia p50/p95 (<15s): NO-GO.

Status recomendado para ML-57:
- Manter In Progress com foco em novo ciclo de retrieval scoring por dominio + curation de evidencias por tipo de projeto.

## Proximo passo tecnico objetivo
1. Introduzir score hibrido de retrieval (keyword + tag + tipo de projeto + peso por historico de acerto).
2. Curar catalogo de evidencias por dominio (energia, rede, sensores, atuacao, governanca).
3. Rerodar os mesmos 10 casos com budget de contexto controlado para tentar gate de relevancia >=85%.
