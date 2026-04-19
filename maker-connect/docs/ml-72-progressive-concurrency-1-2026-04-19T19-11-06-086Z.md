# ML-72 Async + Q4 + Parallel + Embedding Cache - 2026-04-19

Generated at: 2026-04-19T19:11:06.039Z
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
| Parse valid rate (%) | 90 | 100 | -10 |
| Schema valid rate (%) | 90 | 100 | -10 |
| P50 latency (ms) | 30563 | 31694 | -1131 |
| P95 latency (ms) | 33962 | 38281 | -4319 |
| P50 queue wait (ms) | 0 | n/a | n/a |
| P95 queue wait (ms) | 1 | n/a | n/a |
| Relevance proxy avg (%) | 82.5 | 92.5 | -10 |
| Avg context chars | 458 | 658 | -200 |

## Runtime stats

- Model fallback count: 0
- Embedding cache hits: 352
- Embedding cache misses: 0
- Embedding fallback-to-lexical count: 0

## C6 comparison

- Baseline latency: 40563 ms
- Optimized latency: 29748 ms
- Delta: -10815 ms
- Baseline relevance: 100%
- Optimized relevance: 75%

## Gate check

- Parse >=95: FAIL
- Schema >=95: FAIL
- Relevance >=85: FAIL

## Artifacts

- JSON report: docs/ml-72-async-q4-parallel-cache-10cases-2026-04-19.json
- Embedding cache: docs/.cache/ml-72-embedding-cache.json
