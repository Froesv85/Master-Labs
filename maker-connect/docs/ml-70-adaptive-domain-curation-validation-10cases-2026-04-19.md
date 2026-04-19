# ML-70 Adaptive Domain Scoring + Curation Validation - 10 Cases

Generated at: 2026-04-19T17:36:17.728Z
Model: qwen2.5:7b-instruct

## Summary

| Metric | Adaptive Cycle | Baseline Curated | Delta |
|---|---:|---:|---:|
| Parse valid rate (%) | 100 | 100 | 0 |
| Schema valid rate (%) | 100 | 100 | 0 |
| P50 latency (ms) | 39223 | 31694 | 7529 |
| P95 latency (ms) | 40752 | 38281 | 2471 |
| Relevance proxy avg (%) | 92.5 | 92.5 | 0 |
| Avg context chars | 477 | 658 | -181 |

## Gate check

- Parse >=95: PASS
- Schema >=95: PASS
- Relevance >=85: PASS

## Artifact

- JSON report: docs/ml-70-adaptive-domain-curation-validation-10cases-2026-04-19.json
