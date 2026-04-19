# ML-69 Microcycle C6/C10 - 2026-04-19

Generated at: 2026-04-19T16:37:22.162Z
Model: qwen2.5:7b-instruct

## Summary

| Metric | Value |
|---|---:|
| Parse valid rate (%) | 100 |
| Schema valid rate (%) | 100 |
| P50 latency (ms) | 32213 |
| P95 latency (ms) | 32213 |
| Relevance proxy avg (%) | 75 |
| Avg context chars | 281 |

## Gate check

- Parse >=95: PASS
- Schema >=95: PASS
- Relevance >=85: FAIL

## Notes

- Context was minimized to three curated evidence items per sample.
- Focus was kept on C6 and C10 only.
- If latency still needs improvement, the next lever is reducing prompt verbosity without dropping the mandatory keyword coverage.

## Artifact

- JSON report: docs/ml-69-microcycle-c6-c10-2026-04-19.json
