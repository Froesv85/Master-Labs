# ML-66 Prompt v3 Validation - 10 Cases

Generated at: 2026-04-19T14:58:27.544Z
Model: qwen2.5:7b-instruct

## Summary

| Metric | Value |
|---|---:|
| Parse valid rate (%) | 100 |
| Schema valid rate (%) | 90 |
| P50 latency (ms) | 27390 |
| P95 latency (ms) | 37478 |
| Relevance proxy avg (%) | 72.5 |

## Gates

| Gate | Result |
|---|---|
| Parse >= 95% | PASS |
| Schema >= 95% | FAIL |
| Relevance >= 85% | FAIL |

## Per sample

| Case | Parse | Schema | Latency (ms) | Relevance (%) |
|---|---|---|---:|---:|
| C1 | yes | yes | 37478 | 100 |
| C2 | yes | no | 14800 | 50 |
| C3 | yes | yes | 21370 | 100 |
| C4 | yes | yes | 21262 | 100 |
| C5 | yes | yes | 24497 | 100 |
| C6 | yes | yes | 28336 | 75 |
| C7 | yes | yes | 27390 | 75 |
| C8 | yes | yes | 30689 | 75 |
| C9 | yes | yes | 23215 | 25 |
| C10 | yes | yes | 32455 | 25 |

## Artifact

- JSON report: docs/ml-66-prompt-v3-validation-10cases-2026-04-19.json
