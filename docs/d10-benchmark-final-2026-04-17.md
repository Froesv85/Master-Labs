# Benchmark Final D10-T1 - 2026-04-17

## Escopo
Validacao final de KPI para a subtarefa D10-T1 (ML-57) no fluxo de extracao e callback.

## Metodo
- Projeto de teste: id 7
- Janela de amostra: 10 execucoes consecutivas
- Logs analisados: ids 64 a 73 em ProjectExtractionLog
- Fluxo: POST extract -> processamento n8n -> callback -> status done

## Resultado consolidado
- Total de execucoes na amostra: 10
- Execucoes concluidas (done): 10
- p50 de latencia: 238.937 ms
- p95 de latencia: 385.570 ms
- Min latencia: 70.742 ms
- Max latencia: 385.570 ms
- Taxa de parse JSON valida: 100,00%
- Relevancia media normalizada: 48,55%

## Avaliacao contra criterios D10
- Relevancia >= 85%: NAO ATENDIDO
- Latencia < 15s: NAO ATENDIDO
- Parse JSON >= 95%: ATENDIDO

## Conclusao tecnica
A validacao de KPI foi executada com sucesso e evidencia completa. O gate D10 permanece em progresso porque os KPIs de relevancia e latencia ainda estao abaixo do alvo.

## Proximas acoes recomendadas
1. Focar tuning de prompt e grounding para elevar relevancia (normalizacao da saida de confidenceScore e schema unico).
2. Reduzir latencia com otimização de fila/processamento n8n e tamanho de contexto enviado ao modelo.
3. Repetir benchmark apos ajustes e comparar tendencia (p50/p95 e relevancia media).

## Rerun benchmark r2 (2026-04-18)
- Arquivo: `maker-connect/docs/d10-t1-benchmark-final-r2.json`
- Projeto de teste: id 7
- Janela de observacao: 10 logs mais recentes da rodada

Resultado do snapshot r2:
- Logs inspecionados: 10
- Execucoes concluidas (done): 2
- p50 de latencia (done): 96542.000 ms
- p95 de latencia (done): 117467.000 ms
- Min latencia (done): 73292.000 ms
- Max latencia (done): 119792.000 ms
- Taxa de parse JSON valida (done): 100,00%
- Relevancia media normalizada (done): 47,25%
- Pendencias no lote: 8 execucoes `queued`

Avaliacao atualizada contra criterios D10:
- Relevancia >= 85%: NAO ATENDIDO
- Latencia < 15s: NAO ATENDIDO
- Parse JSON >= 95%: ATENDIDO (para execucoes concluídas)
- Estabilidade de conclusao do lote: NAO ATENDIDO

Conclusao desta rodada:
- Apesar do gate de estabilidade ter sido atingido no rerun r4 do T2, o benchmark r2 nao sustentou estabilidade no lote de 10 execucoes.
- O fechamento de ML-57 deve permanecer condicionado a nova rodada apos tuning de fila/callback e melhoria de relevancia.
