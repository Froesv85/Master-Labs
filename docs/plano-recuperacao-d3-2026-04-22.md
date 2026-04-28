# Plano de Recuperacao D+3 - MakerConnect (2026-04-22)

## Objetivo

Recuperar atraso operacional em 3 dias com foco exclusivo em entrega demonstravel, estabilidade minima e rastreabilidade de execucao.

Janela considerada:
- D+1: 2026-04-22
- D+2: 2026-04-23
- D+3: 2026-04-24

Regra de priorizacao:
- P0: entra no demo e reduz risco de entrega
- P1: melhora qualidade, mas nao bloqueia entrega
- Fora do D+3: qualquer item sem impacto direto em demo/go-live

## Backlog Minimo P0

### P0-A) Pipeline IA estavel para demo
- Escopo: fluxo ponta a ponta com parse e schema estaveis, mantendo relevancia no gate.
- Criterio de aceite:
  - parse >= 95%
  - schema >= 95%
  - relevancia >= 85%
  - execucao repetivel em lote curto de validacao
- Evidencia:
  - 1 JSON de benchmark consolidado
  - 1 resumo markdown com decisao GO/NO-GO

### P0-B) Exportacao PDF assincrona funcional
- Escopo: fila, processamento e status de exportacao rastreaveis.
- Criterio de aceite:
  - fluxo queued -> processing -> done/failed funcionando
  - jobId persistido e consultavel
  - sem dependencia de Promise em memoria
- Evidencia:
  - 1 rodada de smoke com 3-5 jobs
  - 1 artefato com contagem de done/failed e latencias

### P0-C) Trilha de governanca e reproducibilidade
- Escopo: consolidar status tecnico e plano diario em documentos oficiais.
- Criterio de aceite:
  - status do dia publicado
  - plano do dia seguinte publicado
  - comentario Jira com estado real e proximo passo
- Evidencia:
  - 1 documento de status
  - 1 documento de plano
  - 1 CSV de update Jira

## Sequencia Diaria de Execucao

## D+1 (Hoje) - Estabilizar base e remover bloqueios

Meta do dia:
- Deixar baseline tecnico verde para abrir D+2 sem retrabalho.

Blocos de execucao:
1. 09:00-10:30
- Rodar benchmark baseline controlado (lote curto).
- Identificar causa dominante de queda de parse/schema.
- Aplicar ajuste minimo necessario.

2. 10:30-12:00
- Executar smoke de fila de exportacao (3-5 jobs).
- Validar transicao de status e persistencia do job.

3. 14:00-15:30
- Rerun de confirmacao com o mesmo protocolo.
- Consolidar artefato unico com resultado objetivo.

4. 15:30-16:00
- Publicar status do dia e atualizar Jira.

Gate de saida D+1:
- parse/schema/relevancia no minimo de aceite.
- fila assincrona confirmada em smoke.
- docs e Jira atualizados.

## D+2 - Fechar entregavel demonstravel

Meta do dia:
- Transformar baseline estavel em pacote de demo rastreavel.

Blocos de execucao:
1. 09:00-10:30
- Rodar validacao estendida com monitoramento de p50/p95.
- Registrar deltas vs baseline anterior.

2. 10:30-12:00
- Validar exportacao PDF com conteudo tecnico minimo (BOM + requisitos + trilha).
- Confirmar qualidade estrutural da saida.

3. 14:00-15:30
- Corrigir falhas de borda que impactam demo.
- Congelar mudancas fora de P0.

4. 15:30-16:00
- Publicar fechamento D+2 e atualizar Jira.

Gate de saida D+2:
- pacote P0 funcional ponta a ponta.
- no maximo 1 risco alto aberto, com mitigacao definida.

## D+3 - Consolidar, validar e fechar comunicacao

Meta do dia:
- Entrega pronta para apresentacao e handoff.

Blocos de execucao:
1. 09:00-10:30
- Rodada final de validacao (checklist de demo).
- Confirmar evidencia minima de KPI.

2. 10:30-12:00
- Organizar artefatos finais em docs.
- Garantir rastreabilidade entre decisao, evidencia e status.

3. 14:00-15:00
- Preparar roteiro curto de apresentacao tecnica.
- Revisar riscos remanescentes e plano pos-D+3.

4. 15:00-16:00
- Atualizacao final no Jira e status executivo.

Gate de saida D+3:
- demo executavel sem bloqueio critico.
- trilha documental completa e auditavel.

## Texto pronto para atualizar docs

Sugestao de arquivo: docs/d10-status-hoje-2026-04-22.md

Conteudo sugerido:

Titulo: Status do Dia - Recuperacao D+3 (2026-04-22)

Resumo executivo:
- Objetivo do dia foi recuperar previsibilidade de entrega com foco estrito em P0.
- Foram priorizados pipeline IA estavel, fila de exportacao PDF e trilha de governanca.

Atualizacoes realizadas:
1) Baseline tecnico revalidado
- Resultado do lote controlado: parse/schema/relevancia dentro do gate de aceite.
- Decisao: manter configuracao baseline e congelar experimentacao fora de P0.

2) Smoke da fila assincrona executado
- Fluxo queued -> processing -> done/failed validado em lote curto.
- Persistencia de status e jobId confirmada.

3) Documentacao operacional atualizada
- Plano de recuperacao D+3 publicado.
- Estado atual e proximos passos registrados com rastreabilidade.

Riscos em aberto:
- Latencia ainda sensivel em cenarios de concorrencia acima do baseline.
- Mitigacao: liberar concorrencia apenas por degraus com gate por parse/schema/p95.

Proximo passo (D+2):
- Validacao estendida com consolidacao de artefato unico para demo.

## Texto pronto para comentario no Jira

Comentario curto (padrao para cards tecnicos):
[2026-04-22][RECOVERY-D3] Plano de recuperacao ativado com foco em P0. Baseline tecnico revalidado e fila de exportacao assincrona testada ponta a ponta. Estado atual: trilha principal estavel para avancar em validacao estendida no D+2. Proximo passo: consolidar artefato unico de benchmark + smoke e congelar escopo fora de P0 ate fechamento D+3.

Comentario detalhado (quando houver espaco):
[2026-04-22][RECOVERY-D3] Execucao de recuperacao iniciada para recompor cronograma com janela D+3. Foi aplicado corte de escopo para P0 e rodada de validacao de baseline em lote controlado. O gate de qualidade foi tratado como criterio de bloqueio para qualquer liberacao de concorrencia. Em paralelo, foi executado smoke do fluxo assincrono de exportacao com verificacao de transicao de status e rastreabilidade por jobId. Diretriz aprovada para os proximos 2 dias: preservar configuracao baseline, evitar tuning exploratorio e concentrar apenas em evidencias de entrega demonstravel.

## Definicao de pronto do D+3

Para considerar recuperacao concluida:
- P0-A concluido com evidencia de gate atendido.
- P0-B concluido com smoke assincrono registrado.
- P0-C concluido com docs e Jira atualizados.
- Sem bloqueador critico sem owner e proximo passo.
