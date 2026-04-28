# ML-57 Phase 2 Packet - 2026-04-19

## Key visible in repository artifacts
- `ML-57` is the Jira key associated with D10-T1 in the imported issue registry.
- Source artifact: `docs/jira-import-result-d5-d10-2026-04-17.json`.
- Note: direct Jira REST access returned 404 from the current credential/context, so the repository key is the reliable reference for local updates.

## Goal
Prepare the Phase 2 tuning package with fresh evidence and a ready-to-post status update for ML-57.

## Evidence added today
- Stability rerun with `run-stability-lot.ps1` showed no trigger or polling failures.
- Extended observation proved the remaining item completed late, which supports a latency bottleneck rather than callback regression.
- Comparative benchmark run with local models completed for:
  - `qwen2.5:7b-instruct`
  - `llama3.1:8b`

## Comparative findings

### qwen2.5:7b-instruct
- Parse v2: 100%
- Schema v2: 100%
- P50 v2: 29.729s
- P95 v2: 29.804s
- Relevance v2: 100%

### llama3.1:8b
- Parse v2: 100%
- Schema v2: 100%
- P50 v2: 26.380s
- P95 v2: 26.909s
- Relevance v2: 81.25%

## Interpretation
- The model swap improves part of latency but does not reach the demo target.
- Relevance remains below the desired 85% threshold on the alternative model.
- Stability is already decoupled from the remaining KPI work.

## T2 plan
- Build a domain-specific prompt pack for maker IoT inputs.
- Use 10 representative cases spanning sensors, actuation, fallback, and logging.
- Score relevance case by case against the new comparative baseline.

## T3 plan
- Review retrieval context quality and prune noisy evidence blocks.
- Validate whether top-k and chunking choices improve relevance without hurting parse.
- Re-run the benchmark after T2 to isolate the impact of retrieval changes.

## Ready-to-post Jira note
"[2026-04-19] Phase 2 tuning packet updated. T1 comparison completed with qwen2.5:7b-instruct and llama3.1:8b. Callback stability already proven. Next: T2 prompt pack and T3 retrieval tuning, using today's benchmark as baseline evidence."
