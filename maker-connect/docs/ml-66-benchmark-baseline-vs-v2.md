# ML-66 Benchmark - Baseline vs Prompt v2

Generated at: 2026-04-19T01:54:26.681Z
Model: qwen2.5:7b-instruct

## Summary

| Metric | Baseline | v2 | Delta |
|---|---:|---:|---:|
| Parse valid rate (%) | 100 | 25 | -75 |
| Schema valid rate (%) | 100 | 25 | -75 |
| P50 latency (ms) | 21941 | 25880 | 3939 |
| P95 latency (ms) | 22795 | 28770 | 5975 |
| Relevance proxy avg (%) | 100 | 25 | -75 |

## Notes

- v2 enforces unified schema: \`schemaVersion: mc_extract_v2\`.
- v2 requires strict fields for technicalRequirements and suggestedBOM.
- Relevance here is a proxy based on expected keyword coverage per sample.

## Artifacts

- JSON report: \`docs/ml-66-benchmark-baseline-vs-v2.json\`
