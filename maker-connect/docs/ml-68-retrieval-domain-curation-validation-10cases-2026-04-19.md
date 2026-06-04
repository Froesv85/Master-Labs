# ML-68 Retrieval Domain Scoring + Curation Validation - 10 Cases

Generated at: 2026-04-19T16:19:16.252Z
Model: qwen2.5:7b-instruct

## Summary

| Metric | Curated Cycle | Previous Pruned (T3) | Delta |
|---|---:|---:|---:|
| Parse valid rate (%) | 100 | 100 | 0 |
| Schema valid rate (%) | 100 | 90 | 10 |
| P50 latency (ms) | 31694 | 28187 | 3507 |
| P95 latency (ms) | 38281 | 36423 | 1858 |
| Relevance proxy avg (%) | 92.5 | 72.5 | 20 |
| Avg context chars | 658 | 241 | 417 |

## Gate check

- Parse >=95: PASS
- Schema >=95: PASS
- Relevance >=85: PASS

## Artifact

- JSON report: docs/ml-68-retrieval-domain-curation-validation-10cases-2026-04-19.json
