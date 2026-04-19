# ML-66 Benchmark - Baseline vs Prompt v2.3

Generated at: 2026-04-19T14:33:44.078Z
Model: qwen2.5:7b-instruct

## Summary

| Metric | Baseline | v2.3 (fixed 560) | Delta |
|---|---:|---:|---:|
| Parse valid rate (%) | 100 | 100 | 0 |
| Schema valid rate (%) | 100 | 100 | 0 |
| P50 latency (ms) | 20548 | 29729 | 9181 |
| P95 latency (ms) | 22109 | 29804 | 7695 |
| Relevance proxy avg (%) | 87.5 | 100 | 12.5 |

Fixed v2.3 num_predict: 560
Target parse/schema threshold: >= 95%

## Fixed num_predict round

| num_predict | accepted | parse (%) | schema (%) | p50 (ms) | p95 (ms) |
|---:|:---:|---:|---:|---:|---:|
| 560 | yes | 100 | 100 | 29729 | 29804 |

## Notes

- v2.3 foca apenas em latencia real: top 1 evidencia, contexto mais curto, campos textuais minimos.
- num_predict fixo em 560.
- Relevance here is a proxy based on expected keyword coverage per sample.

## Artifacts

- JSON report: docs/ml-66-benchmark-baseline-vs-v2_1.json
