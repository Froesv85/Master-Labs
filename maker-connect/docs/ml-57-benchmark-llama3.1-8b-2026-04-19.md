# ML-66 Benchmark - Baseline vs Prompt v2.3

Generated at: 2026-04-19T14:43:26.893Z
Model: llama3.1:8b

## Summary

| Metric | Baseline | v2.3 (fixed 560) | Delta |
|---|---:|---:|---:|
| Parse valid rate (%) | 75 | 100 | 25 |
| Schema valid rate (%) | 75 | 100 | 25 |
| P50 latency (ms) | 24398 | 26380 | 1982 |
| P95 latency (ms) | 40705 | 26909 | -13796 |
| Relevance proxy avg (%) | 62.5 | 81.25 | 18.75 |

Fixed v2.3 num_predict: 560
Target parse/schema threshold: >= 95%

## Fixed num_predict round

| num_predict | accepted | parse (%) | schema (%) | p50 (ms) | p95 (ms) |
|---:|:---:|---:|---:|---:|---:|
| 560 | yes | 100 | 100 | 26380 | 26909 |

## Notes

- v2.3 foca apenas em latencia real: top 1 evidencia, contexto mais curto, campos textuais minimos.
- num_predict fixo em 560.
- Relevance here is a proxy based on expected keyword coverage per sample.

## Artifacts

- JSON report: docs/ml-66-benchmark-baseline-vs-v2_1.json
