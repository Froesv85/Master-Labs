# ML-72 Async + Q4 + Parallel + Embedding Cache - 2026-04-19

Generated at: 2026-04-19T18:44:17.460Z
Primary model: qwen2.5:7b-instruct-q4_K_M
Fallback model: qwen2.5:7b-instruct
Embedding model: nomic-embed-text

## Configuration

- Concurrency: 1
- Prompt profile: default
- Embeddings enabled: true
- Timeout (ms): 180000

## Summary

| Metric | Result | Baseline Curated | Delta |
|---|---:|---:|---:|
| Parse valid rate (%) | 100 | 100 | 0 |
| Schema valid rate (%) | 100 | 100 | 0 |
| P50 latency (ms) | 31912 | 31694 | 218 |
| P95 latency (ms) | 35786 | 38281 | -2495 |
| P50 queue wait (ms) | 1 | n/a | n/a |
| P95 queue wait (ms) | 1 | n/a | n/a |
| Relevance proxy avg (%) | 92.5 | 92.5 | 0 |
| Avg context chars | 458 | 658 | -200 |

## Runtime stats

- Model fallback count: 0
- Embedding cache hits: 352
- Embedding cache misses: 0
- Embedding fallback-to-lexical count: 0

## C6 comparison

- Baseline latency: 32681 ms
- Optimized latency: 31717 ms
- Delta: -964 ms
- Baseline relevance: 75%
- Optimized relevance: 75%

## Gate check

- Parse >=95: PASS
- Schema >=95: PASS
- Relevance >=85: PASS

## Artifacts

- JSON report: docs/ml-72-async-q4-parallel-cache-10cases-2026-04-19.json
- Embedding cache: docs/.cache/ml-72-embedding-cache.json
