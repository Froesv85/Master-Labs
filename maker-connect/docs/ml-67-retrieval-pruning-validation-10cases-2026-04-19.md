# ML-67 Retrieval Pruning Validation - 10 Cases

Generated at: 2026-04-19T15:50:45.240Z
Model: qwen2.5:7b-instruct

## Summary

| Metric | Broad Context | Pruned Context | Delta (Pruned - Broad) |
|---|---:|---:|---:|
| Parse valid rate (%) | 100 | 100 | 0 |
| Schema valid rate (%) | 80 | 90 | 10 |
| P50 latency (ms) | 30068 | 28187 | -1881 |
| P95 latency (ms) | 37823 | 36423 | -1400 |
| Relevance proxy avg (%) | 70 | 72.5 | 2.5 |
| Avg context chars | 572 | 241 | -331 |

## Decision support

- Pruned context should improve relevance/schema with no meaningful latency regression.
- If relevance and schema are still below gate, next step is retrieval scoring + evidence curation per domain tag.

## Artifact

- JSON report: docs/ml-67-retrieval-pruning-validation-10cases-2026-04-19.json
