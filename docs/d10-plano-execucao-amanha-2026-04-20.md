# Plano de Execucao Amanha - 2026-04-20

## Objetivo

Retomar a trilha ML-72 com foco em estabilizar o baseline q4, validar o fluxo Redis/BullMQ ponta a ponta e liberar concorrencia somente depois de passar nos gates de parse, schema e p95.

## Contexto de partida

- Tuning puro foi encerrado como NO-GO.
- A alternativa arquitetural foi validada no ponto certo: prompt default + q4 + cache + fila async.
- O rollout progressivo ainda nao passou no degrau 1 por parse/schema abaixo do gate.

## Prioridades de amanha

### P0-1) Reparar baseline do gate 1
- Investigar a queda de parse/schema no cenario de concorrencia 1.
- Reproduzir a execucao com o artefato atual e comparar com o ciclo default que passou.
- Ajustar o ponto minimo necessario no prompt, normalizacao ou budget de saida.
- Criterio de aceite: parse >= 95%, schema >= 95% e relevancia >= 85% no degrau 1.

### P0-2) Smoke end-to-end da fila Redis/BullMQ
- Disparar uma exportacao real via API e acompanhar queued -> processing -> done/failed.
- Confirmar atualizacao de status do job e upload do PDF no storage.
- Criterio de aceite: job processado pelo worker sem dependencia de Promise em memoria.

### P1-1) Retomar rollout progressivo 1 -> 2 -> 3
- Rodar novamente o benchmark progressivo depois do baseline ficar verde.
- Liberar o proximo degrau apenas se o anterior passar nos gates.
- Criterio de aceite: relatorio consolidado com decisao objetiva por degrau.

### P1-2) Fechamento operacional em docs e Jira
- Publicar o fechamento final do dia com o estado da arquitetura aprovada.
- Atualizar Jira com a situacao real de ML-66, ML-57 e ML-72.
- Criterio de aceite: rastreabilidade clara entre evidencia, decisao e proximo passo.

## Janela sugerida

1. 09:00-10:30: reparo do gate 1 e rerun controlado
2. 10:30-11:30: smoke da fila Redis/BullMQ
3. 14:00-15:30: novo progressive rollout
4. 15:30-16:00: atualizacao final de docs e Jira

## Artefatos de referencia

- maker-connect/docs/ml-72-async-q4-parallel-cache-10cases-2026-04-19.json
- maker-connect/docs/ml-72-progressive-concurrency-gate-report-2026-04-19.json
- maker-connect/docs/ml-72-plano-rollout-async-q4-2026-04-19.md