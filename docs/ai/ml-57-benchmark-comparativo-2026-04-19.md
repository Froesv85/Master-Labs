# ML-57 Benchmark Comparativo - 2026-04-19

## Objetivo
Comparar o comportamento do pipeline IA com os modelos locais disponiveis hoje para decidir o estado de ML-57.

## Modelos executados
- `qwen2.5:7b-instruct`
- `llama3.1:8b`

Observacao:
- Nao havia variante quantizada/GPU confirmada no ambiente local; este comparativo usa os modelos realmente disponiveis para servir como proxy operacional do T1.

## Resultado resumido

| Modelo | Parse v2 | Schema v2 | P50 v2 | P95 v2 | Relevancia media v2 |
|---|---:|---:|---:|---:|---:|
| qwen2.5:7b-instruct | 100% | 100% | 29,729 ms | 29,804 ms | 100% |
| llama3.1:8b | 100% | 100% | 26,380 ms | 26,909 ms | 81.25% |

## Leitura tecnica
- Os dois modelos passam no gate de parse/schema.
- `llama3.1:8b` foi mais rapido no v2, mas ficou abaixo do Qwen em relevancia media.
- Nenhum dos dois se aproxima ainda do alvo de latencia de demo (<15s).
- O gargalo principal continua sendo runtime/modelo, nao estabilidade de callback.

## Artefatos gerados
- `maker-connect/docs/ml-57-benchmark-qwen2.5-7b-instruct-2026-04-19.json`
- `maker-connect/docs/ml-57-benchmark-qwen2.5-7b-instruct-2026-04-19.md`
- `maker-connect/docs/ml-57-benchmark-llama3.1-8b-2026-04-19.json`
- `maker-connect/docs/ml-57-benchmark-llama3.1-8b-2026-04-19.md`

## Decisao recomendada
- Manter ML-57 em andamento.
- Registrar que o caminho de estabilizacao foi resolvido, mas o KPI depende de tuning de modelo/retention.
- Prosseguir com Phase 2 apenas quando houver variante quantizada/GPU ou ajuste de prompt/retrieval com ganho mensuravel.
