# ML-57 Phase 2 - Tuning Checklist (2026-04-19)

## Objetivo
Reduzir latencia e elevar relevancia para aproximar os KPIs alvo sem alterar o fluxo de callback ja estabilizado.

## Baseline atual (evidencia)
- Latencia alta (ordem de 100s+ em varios casos).
- Relevancia abaixo da meta de 85%.
- Estabilidade de callback validada no backend.
- Comparativo local executado em 2026-04-19 com `qwen2.5:7b-instruct` e `llama3.1:8b`.

## Evidencia nova consolidada
- `qwen2.5:7b-instruct`: parse/schema 100%, p50 29.729s, p95 29.804s, relevancia 100% no v2.
- `llama3.1:8b`: parse/schema 100%, p50 26.380s, p95 26.909s, relevancia 81.25% no v2.
- Conclusao: o caminho de troca de modelo melhora parte do KPI, mas ainda nao fecha a meta de demo.

## Plano de execucao tecnico

### T1) Otimizacao de modelo de inferencia
- [x] Comparar modelo atual vs alternativa quantizada no mesmo hardware.
- [x] Medir tempo medio por execucao em amostra minima de 5 requests.
- [x] Registrar ganho percentual de latencia.

Entregavel:
- Tabela simples de comparacao (modelo, media ms, p95 ms, observacao).

### T2) Prompt pack domain-specific maker IoT
- [x] Definir 10 entradas de validacao com contexto maker real.
- [x] Ajustar prompt para reforcar requisitos tecnicos e BOM util.
- [x] Rodar lote de validacao e medir relevancia media.
- [x] Vincular os artefatos de benchmark de hoje como baseline para o tune.

Resultado atual de T2 (prompt v3 em 10 casos):
- parse valid: 100%
- schema valid: 90%
- p50 latencia: 27.390s
- p95 latencia: 37.478s
- relevancia media: 72.5%

Leitura:
- parse ficou estavel, mas schema e relevancia ainda abaixo do gate alvo.
- proximo foco deve ser T3 (retrieval/context pruning) para elevar relevancia sem piorar latencia.

Entregavel:
- Documento de prompt + score de relevancia por amostra.
- Artefatos de execucao:
  - maker-connect/docs/ml-66-prompt-v3-validation-10cases-2026-04-19.json
  - maker-connect/docs/ml-66-prompt-v3-validation-10cases-2026-04-19.md

### T3) Revisao de embeddings/context retrieval
- [x] Verificar qualidade do contexto recuperado para os 10 casos.
- [x] Ajustar filtros de retrieval para reduzir ruido.
- [x] Reavaliar impacto em relevancia e parse.
- [x] Consolidar criterios de corte para comparar relevancia por caso com o benchmark de hoje.

Resultado de T3:
- broad: parse 100%, schema 80%, p50 30.068s, p95 37.823s, relevancia 70%, contexto medio 572 chars.
- pruned: parse 100%, schema 90%, p50 28.187s, p95 36.423s, relevancia 72.5%, contexto medio 241 chars.
- conclusao: pruning melhorou schema, relevancia e tamanho de contexto, mas ainda abaixo do gate final de relevancia.

Entregavel:
- Notas de ajuste do retrieval e delta de relevancia.

### T4) Benchmark de confirmacao
- [x] Rodar benchmark final apos T1-T3.
- [x] Consolidar p50, p95, parse success e relevancia.
- [x] Atualizar status de ML-57 no Jira com resultado objetivo.

Resultado consolidado de T4:
- melhor configuracao atual manteve parse 100%, schema 90%, p50 28.187s, p95 36.423s, relevancia 72.5%.
- decisao de fechamento: NO-GO para encerramento de ML-57 no dia (criterios de schema/relevancia/latencia nao atingidos).

Evidencia:
- docs/ml-57-benchmark-final-pos-t1-t3-2026-04-19.md

## Novo ciclo iniciado (Domain Scoring + Curation)

Status:
- [x] Curadoria de evidencias por dominio aplicada.
- [x] Novo scoring de retrieval com peso de dominio/reliability aplicado.
- [x] Rerun dos mesmos 10 casos executado.

Resultado do novo ciclo (ML-68):
- parse valid: 100%
- schema valid: 100%
- p50 latencia: 31.694s
- p95 latencia: 38.281s
- relevancia media: 92.5% (gate >=85 atingido)

Delta vs T3 pruned:
- relevancia: +20.0pp (72.5% -> 92.5%)
- schema: +10pp (90% -> 100%)
- latencia p50/p95: +3.507s / +1.858s (trade-off de qualidade)

Casos que ainda pedem ajuste fino de relevancia:
- C6 (75%): reforcar termo "lote" no contexto e no BOM de conectividade.
- C10 (50%): reforcar keyword "json" e "auditavel" no bloco de requisitos/governanca.

Artefatos:
- maker-connect/docs/ml-68-retrieval-domain-curation-validation-10cases-2026-04-19.json
- maker-connect/docs/ml-68-retrieval-domain-curation-validation-10cases-2026-04-19.md

### Microciclo C6/C10 (iteração localizada)
- [x] Rodar microciclo com contexto curto e foco em C6/C10.
- [x] Rodar segunda variante com keywords forçadas.

Resultado do microciclo v1:
- parse valid: 100%
- schema valid: 100%
- p50 latencia: 32.213s
- relevancia media: 75%
- contexto medio: 281 chars

Resultado do microciclo v2:
- parse valid: 0%
- schema valid: 0%
- p50 latencia: 24.590s
- relevancia media: 0%
- contexto medio: 199 chars

Resultado do microciclo v3 (equilibrado):
- parse valid: 100%
- schema valid: 100%
- p50 latencia: 36.605s
- relevancia media: 87.5% (gate >=85 atingido)
- contexto medio: 218 chars
- detalhe por caso: C6=75%, C10=100%

Proxima tarefa ativa (T5):
- foco em latency recovery de C6 mantendo relevancia media >=85%.
- plano registrado em docs/ml-69-t5-latency-recovery-c6-2026-04-19.md.

Resultado T5 v4 (adaptive budget + schema normalizer):
- parse valid: 100%
- schema valid: 100%
- p50 latencia: 31.030s
- p95 latencia: 31.030s
- relevancia media: 87.5% (mantida)
- contexto medio: 176 chars
- delta vs v3: p50/p95 -5.575s, contexto -42 chars, sem perda de relevancia

Resultado T6 (adaptive no lote de 10 casos):
- parse valid: 100%
- schema valid: 100%
- p50 latencia: 39.223s
- p95 latencia: 40.752s
- relevancia media: 92.5% (mantida)
- contexto medio: 477 chars
- delta vs baseline curado ML-68: p50 +7.529s, p95 +2.471s, contexto -181 chars
- leitura: o padrão adaptativo em escala preservou os gates, mas piorou a latencia; nao e candidato de fechamento para performance.

Leitura:
- reduzir contexto sozinho manteve parse/schema, mas nao subiu relevancia para o alvo.
- forcar keywords demais derrubou a validade do output.
- abordagem equilibrada (v3) recuperou qualidade estrutural e relevancia media alvo, mas ainda com latencia acima da referencia.
- v4 reduziu latencia de forma material mantendo todos os gates de qualidade do microciclo C6/C10.

Entregavel:
- Relatorio final de benchmark com decisao GO/NO-GO para fechamento.

## Criterios de sucesso da fase
- Latencia p50 < 15s (referencia de demo).
- Latencia p95 < 15s (referencia de demo).
- Relevancia media >= 85%.
- Parse success >= 95%.

## Donos sugeridos
- AI-Orchestrator: T1, T2, T3
- Backend-Platform: suporte de instrumentacao e logs
- PM-Lead/Delivery: fechamento de status e Jira

## Comando util para smoke de estabilidade (controle)
```powershell
pwsh -NoProfile -File .\scripts\run-stability-lot.ps1 `
  -ApiUrl "http://localhost:3000" `
  -ProjectId 7 `
  -Label custom `
  -SampleSize 5 `
  -MaxObserveSeconds 300 `
  -OutputPath ".\maker-connect\docs\d10-t2-smoke-extended-result-phase2-control.json"
```
### 13) Microajuste C6 em lote de 10 casos
Arquivos de evidencia:
- maker-connect/scripts/validate-retrieval-domain-curation-c6-microadjust-10cases.mjs
- maker-connect/docs/ml-71-c6-microadjust-10cases-2026-04-19.json
- maker-connect/docs/ml-71-c6-microadjust-10cases-2026-04-19.md

Resumo executivo:
- batch parse 100%, schema 100%, relevancia 95%.
- batch p50 36.622s e p95 40.688s.
- C6 baseline 42.510s -> C6 otimizado 40.688s (-1.822s).
- leitura: C6 melhorou isoladamente, mas o lote inteiro ainda ficou mais lento que o baseline curado.

## CONCLUSAO: NO-GO para tuning puro (ML-66/ML-67)
Totalizado 7 iteracoes (T1-T7) com resultado:
- latencia final p50 36.622s vs meta <15s (2.4x distancia)
- gates de qualidade preservados (parse/schema/relevancia >=85%)
- todos os levers de tuning testados: prompt v3, retrieval pruning, domain scoring, adaptive budget, microajuste isolado
- ganho isolado de C6 (-1.822s) nao se traduziu em ganho de batch
- retorno decrescente confirmado em cada iteracao

Proximos passos para latencia (fora escopo de tuning puro):
- mudar modelo para versao quantizada/mais rapida (e.g., Qwen q4)
- paralelizar inferencia
- usar caching de embeddings
- reduzir drasticamente prompt/contexto (risco de perder relevancia)
- revisar arquitetura de pipeline (sync vs async)

Recomendacao: escalar para stakeholder para decisao de arquitetura. Tuning puro atingiu limite tecnico.

## 14) Execucao da alternativa aprovada pelo stakeholder (ML-72)

Escopo aprovado:
- modelo q4 (menor footprint),
- paralelizacao de inferencia,
- cache de embeddings,
- validacao de prompt reduzido,
- revisao de arquitetura sync vs async com fila.

Implementacao entregue:
- script: maker-connect/scripts/validate-retrieval-domain-curation-async-q4-10cases.mjs
- plano de rollout: docs/ml-72-plano-rollout-async-q4-2026-04-19.md

Rodada A (aggressive + concorrencia 2):
- parse 90%, schema 90%, relevancia 82.5%
- p50 64.764s, p95 71.101s
- decisao: reprovado (trade-off ruim por reducao agressiva de prompt)

Rodada B (default + concorrencia 1):
- parse 100%, schema 100%, relevancia 92.5%
- p50 31.912s, p95 35.786s
- cache de embeddings: 352 hits / 0 misses
- fallback de modelo: 0
- decisao: aprovado para avancar em arquitetura async controlada

Conclusao da fase:
- a alternativa vencedora nao foi o prompt agressivo; foi fila async + cache + q4 com prompt default e concorrencia conservadora.
- proximo passo e mover para fila persistente (Redis/BullMQ) com rollout progressivo de concorrencia.
