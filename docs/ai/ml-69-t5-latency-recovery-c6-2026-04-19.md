# ML-69 T5 - Latency Recovery focado em C6 (2026-04-19)

## Objetivo imediato
Recuperar latencia no caso C6 sem perder os ganhos de qualidade do ciclo equilibrado v3.

## Contexto de partida
- Microciclo v3 (C6/C10): parse 100%, schema 100%, relevancia media 87.5%, p50 36.605s.
- C6 ainda em 75% de relevancia e com latencia alta.
- C10 ja estabilizado em 100% de relevancia no v3.

## Escopo T5
- Caso alvo principal: C6.
- Caso de controle: C10 (apenas para validar nao regressao).

## Hipotese tecnica
Diminuir custo de inferencia em C6 mantendo cobertura de keywords com:
1. prompt operacional mais curto (menos texto instrucional),
2. BOM minimo orientado a conectividade resiliente,
3. contexto de 2 evidencias + 1 fallback no maximo,
4. `num_predict` ajustado por caso para reduzir truncamento e custo.

## Criterios de aceite T5
- Parse valid >= 95% (microciclo de 2 casos).
- Schema valid >= 95%.
- Relevancia media >= 85%.
- Reducao de latencia p50 vs microciclo v3 (baseline: 36.605s).

## Plano de execucao
1. Criar harness `v4` com budget adaptativo por caso.
2. Rodar C6/C10 e consolidar delta vs v3.
3. Publicar comentario Jira com resultado objetivo.

## Artefatos esperados
- maker-connect/scripts/validate-retrieval-microcycle-c6-c10-v4.mjs
- maker-connect/docs/ml-69-microcycle-c6-c10-v4-2026-04-19.json
- maker-connect/docs/ml-69-microcycle-c6-c10-v4-2026-04-19.md
