# ML-72 Plano de rollout async + q4 - 2026-04-19

## Objetivo

Migrar da estrategia de tuning puro para otimização arquitetural com foco em latencia sem perder relevancia.

## Mudancas aprovadas pelo stakeholder

1. Modelo primario com quantizacao q4 (mais rapido, menor footprint)
2. Paralelizacao da inferencia com limite de concorrencia
3. Caching de embeddings para evitar recomputacao
4. Reducao agressiva de prompt com validacao de trade-off
5. Pipeline async com fila para desacoplar processamento

## Implementacao tecnica inicial

Arquivo criado:
- maker-connect/scripts/validate-retrieval-domain-curation-async-q4-10cases.mjs

Capacidades do script:
- Modelo primario q4 com fallback automatico
- Execucao paralela com fila em memoria (configuravel por OLLAMA_CONCURRENCY)
- Cache persistente em docs/.cache/ml-72-embedding-cache.json
- Prompt profile configuravel (aggressive/default)
- Relatorio comparativo com baseline curado (ML-68)

## Variaveis de ambiente

- OLLAMA_CHAT_MODEL (default: qwen2.5:7b-instruct-q4_K_M)
- OLLAMA_FALLBACK_MODEL (default: qwen2.5:7b-instruct)
- OLLAMA_EMBEDDING_MODEL (default: nomic-embed-text)
- OLLAMA_CONCURRENCY (default: 3)
- PROMPT_PROFILE (default: aggressive)
- ENABLE_EMBEDDINGS (default: true)
- REQUEST_TIMEOUT_MS (default: 90000)

## Comando de execucao

Node (na pasta maker-connect):

node scripts/validate-retrieval-domain-curation-async-q4-10cases.mjs

## Criterios de aceite

1. Parse >= 95%
2. Schema >= 95%
3. Relevancia >= 85%
4. P50 menor que baseline ML-68 (31.694 ms)
5. P95 sem regressao superior a 15% contra baseline

## Roadmap de arquitetura (sync vs async)

Fase A - Benchmark local (agora)
- Validar ganho com fila em memoria e concorrencia 2/3/4
- Medir impacto real do cache de embeddings (warmup vs hot cache)

Fase B - Pipeline async produtivo
- API recebe request e cria job
- Worker processa inferencia em paralelo controlado
- Persistir estado do job: queued | processing | done | failed
- Retentar falhas transientes com backoff

Fase C - Escala
- Trocar fila em memoria por Redis/BullMQ
- Observabilidade por metrica de fila: throughput, queue wait p50/p95, retry rate
- Caching compartilhado com invalidacao por versao de modelo

## Riscos e mitigacao

- Risco: perda de relevancia por prompt agressivo
  Mitigacao: comparar relevance proxy por caso e reverter para profile default em casos criticos

- Risco: modelo q4 indisponivel localmente
  Mitigacao: fallback automatico para qwen2.5:7b-instruct

- Risco: embedding model indisponivel
  Mitigacao: fallback para score lexical sem interromper pipeline

## Proxima decisao executiva

Se Fase A atingir gates de qualidade e reduzir latencia de forma consistente, seguir para Fase B com fila assíncrona persistente no backend (Redis/BullMQ).