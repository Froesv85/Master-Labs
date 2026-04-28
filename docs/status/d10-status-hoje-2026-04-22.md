# Status do Dia - Recuperacao D+3 (2026-04-22)

## Resumo executivo
- Foco do dia: recompor previsibilidade de entrega com corte de escopo para P0.
- Estado atual: trilha principal estabilizada para avancar no D+2 com validacao estendida.
- Decisao operacional: congelar experimentacao fora de P0 ate o fechamento do D+3.

## Atualizacoes realizadas

### 1) Plano de recuperacao D+3 publicado
Arquivo criado:
- docs/plano-recuperacao-d3-2026-04-22.md

Resumo:
- backlog minimo P0 definido com criterio de aceite e evidencia por item;
- sequencia diaria estabelecida para D+1, D+2 e D+3;
- texto pronto de atualizacao para docs e Jira consolidado no mesmo artefato.

### 2) Backlog P0 consolidado para execucao imediata
Itens ativos de recuperacao:
- P0-A: pipeline IA estavel para demo (gate parse/schema/relevancia);
- P0-B: exportacao PDF assincrona funcional (queued -> processing -> done/failed);
- P0-C: trilha de governanca e reproducibilidade (status/plano/Jira).

Leitura tecnica:
- o backlog foi reduzido ao minimo que aumenta chance real de entrega;
- qualquer item sem impacto de demo foi explicitamente deslocado para pos-D+3.

### 3) Pacote Jira de recuperacao preparado
Arquivo criado:
- docs/jira-kanban-update-recuperacao-d3-2026-04-22.csv

Resumo:
- comentarios prontos para ML-57, ML-74 e ML-66;
- status sugeridos alinhados ao plano de recuperacao;
- placeholder de issue de docs mantido para substituicao pela chave real.

### 4) Diretriz de execucao para os proximos 2 dias
Diretriz aprovada:
- manter baseline estavel como referencia unica;
- liberar concorrencia somente por degraus e por gate;
- concentrar esforco em evidencia demonstravel (benchmark consolidado + smoke de fila);
- evitar tuning exploratorio fora do escopo P0.

## Estado por frente

### Pipeline IA (P0-A)
- Status: In Progress
- Objetivo imediato: confirmar gate minimo em lote controlado e repetir com consistencia.
- Gate de aceite:
  - parse >= 95%
  - schema >= 95%
  - relevancia >= 85%

### Exportacao PDF assíncrona (P0-B)
- Status: In Progress
- Objetivo imediato: confirmar fluxo ponta a ponta com rastreabilidade por jobId.
- Gate de aceite:
  - transicao queued -> processing -> done/failed em lote curto;
  - ausencia de dependencia de Promise em memoria;
  - consolidacao de contagem done/failed e latencias.

### Governanca e rastreabilidade (P0-C)
- Status: In Progress
- Objetivo imediato: manter sincronia entre docs, evidencia e Jira sem defasagem.
- Gate de aceite:
  - status do dia publicado;
  - plano do proximo dia publicado;
  - comentario Jira registrado com proximo passo objetivo.

## Riscos e mitigacao

### R1) Latencia sob concorrencia acima do baseline
- Impacto: degrada demo e aumenta chance de timeout.
- Mitigacao: rollout progressivo 1 -> 2 -> 3 apenas com gate por parse/schema/p95.

### R2) Regressao por alteracoes fora de P0
- Impacto: consumo de tempo sem ganho de entrega.
- Mitigacao: congelamento de escopo e revisao de mudanca por impacto em demo.

### R3) Defasagem entre execucao e comunicacao
- Impacto: perda de rastreabilidade de decisao.
- Mitigacao: fechamento diario com pacote padrao (status + plano + Jira).

## Comando de referencia (execucao operacional)

```powershell
pwsh -NoProfile -File .\scripts\run-stability-lot.ps1 `
  -ApiUrl "http://localhost:3000" `
  -ProjectId 7 `
  -Label recovery-d3 `
  -SampleSize 5 `
  -MaxObserveSeconds 300 `
  -OutputPath ".\maker-connect\docs\recovery-d3-smoke-2026-04-22.json"
```

## Registro curto para Jira (copiar/colar)
"[2026-04-22][RECOVERY-D3] Plano de recuperacao ativado com foco em P0. Baseline tecnico tratado como referencia unica e pacote de execucao preparado para validacao estendida no D+2. Estado atual: trilha principal estavel para avancar sem expandir escopo. Proximo passo: consolidar benchmark + smoke em artefato unico e fechar gate de saida D+2."

## Proximo passo (D+2)
- Rodar validacao estendida com monitoramento de p50/p95;
- consolidar artefato unico com benchmark e smoke;
- publicar fechamento D+2 e atualizar Jira com decisao GO/NO-GO por gate.
