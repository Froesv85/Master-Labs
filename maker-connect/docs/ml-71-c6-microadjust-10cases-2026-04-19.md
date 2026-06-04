# ML-71 C6 Microadjust in 10-case batch - 2026-04-19

Generated at: 2026-04-19T17:55:33.111Z
Model: qwen2.5:7b-instruct

## Summary

| Metric | Result | Baseline Curated | Delta |
|---|---:|---:|---:|
| Parse valid rate (%) | 100 | 100 | 0 |
| Schema valid rate (%) | 100 | 100 | 0 |
| P50 latency (ms) | 36622 | 31694 | 4928 |
| P95 latency (ms) | 40688 | 38281 | 2407 |
| Relevance proxy avg (%) | 95 | 92.5 | 2.5 |
| Avg context chars | 458 | 658 | -200 |

## C6 comparison

- Baseline latency: 42510 ms
- Optimized latency: 40688 ms
- Delta: -1822 ms
- Baseline relevance: 75%
- Optimized relevance: 75%

## Gate check

- Parse >=95: PASS
- Schema >=95: PASS
- Relevance >=85: PASS

## Artifact

- JSON report: docs/ml-71-c6-microadjust-10cases-2026-04-19.json
