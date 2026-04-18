# D10-T2 - Estabilidade do Fluxo Principal (2026-04-17)

## Escopo
Validacao do fluxo principal `extract -> n8n -> callback -> status final` apos aplicacao do pacote de correcoes de latencia/relevancia.

## Resultado do smoke de estabilidade
- Amostra monitorada: 5 execucoes (logs 74-78)
- Done: 3
- Queued: 2
- Failed: 0

## Evidencias por execucao
- 74: done, latency 57.258 ms, n8nExecutionId 97
- 75: done, latency 84.578 ms, n8nExecutionId 98
- 76: done, latency 103.181 ms, n8nExecutionId 99
- 77: queued, sem callback no momento da coleta
- 78: queued, sem callback no momento da coleta

## Diagnostico tecnico
- O fluxo principal responde e processa parte dos jobs com callback valido.
- Existe intermitencia de finalizacao em janela curta (jobs permanecem queued por mais tempo que o esperado no instante da verificacao).
- Nao foram observados erros `failed` nessa amostra.

## Acao recomendada antes do rerun final
1. Confirmar workflow atualizado ativo no n8n (versao com prompt enxuto e normalizacao).
2. Executar rerun final com janela maior de observacao para status `queued` (>= 5 minutos por lote).
3. Marcar D10-T2 como done apenas apos 100% do lote final sem stuck em queued.

## Rerun estendido (janela >= 5 min)
- Janela aplicada: 6 minutos de observacao continua.
- Amostra monitorada: 5 execucoes (logs 84-88).
- Done: 2
- Queued: 3
- Failed: 0

Evidencias chave do rerun:
- 84: done, latency 358.943 ms, n8nExecutionId 107
- 88: done, latency 299.595 ms, n8nExecutionId 111
- 85, 86, 87: queued sem callback no limite da janela

Leitura operacional:
- O workflow atualizado esta ativo (callbacks com n8nExecutionId presente nas execucoes concluidas).
- Ainda existe intermitencia de callback/fila no lote, portanto o criterio de 100% done nao foi atendido.

Decisao de status:
- ML-56 deve permanecer em `In Progress` ate eliminar stuck em `queued` no lote completo.

## Rerun estendido r2 (artefato canônico)
- Arquivo: `maker-connect/docs/d10-t2-smoke-extended-result-r2.json`
- Gerado em: 2026-04-18T02:47:00.830Z
- Amostra monitorada: 5 execucoes (logs 89-93)
- Done: 4
- Queued: 1
- Failed: 0
- allDone: false

Evidencias chave do rerun r2:
- 93: done, n8nExecutionId 116
- 92: done, n8nExecutionId 115
- 91: queued sem callback (n8nExecutionId nulo)
- 90: done, n8nExecutionId 113
- 89: done, n8nExecutionId 112

Leitura operacional atualizada:
- O pipeline permanece parcialmente estavel, com 80% de conclusao no lote final observado.
- O criterio de fechamento (100% done sem stuck em queued) segue nao atendido.

Decisao de status atualizada:
- ML-56 permanece em `In Progress`.
- Nao iniciar o rerun final de benchmark D10 enquanto houver item `queued` persistente no lote estendido.

## Rerun estendido r3 (snapshot mais recente)
- Arquivo: `maker-connect/docs/d10-t2-smoke-extended-result-r3.json`
- Gerado em: 2026-04-18T02:56:06.537Z
- Amostra monitorada: 5 execucoes (logs 104-108)
- Done: 0
- Queued: 5
- Failed: 0
- allDone: false

Evidencias chave do rerun r3:
- 104: queued, sem n8nExecutionId
- 105: queued, sem n8nExecutionId
- 106: queued, sem n8nExecutionId
- 107: queued, sem n8nExecutionId
- 108: queued, sem n8nExecutionId

Leitura operacional atualizada (r3):
- O lote mais recente nao entrou em callback dentro da janela observada.
- A regressao de estabilidade confirma que o criterio de fechamento segue nao atendido.

Decisao final desta rodada:
- Manter ML-56 em `In Progress`.
- Bloquear a execucao do rerun final de benchmark D10 ate normalizar callback/fila no fluxo principal.
