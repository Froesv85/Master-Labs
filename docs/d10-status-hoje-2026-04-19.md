# Status do Dia - D10 Follow-up (2026-04-19)

## Resumo executivo
- Foco do dia: manter estabilidade comprovada (ML-56) e acelerar preparacao da trilha de tuning para KPI (ML-57).
- Estado atual: gate de estabilidade validado; KPI de latencia/relevancia ainda em debito tecnico de LLM.

## Atualizacoes realizadas

### 1) Script de estabilidade reforcado
Arquivo atualizado: scripts/run-stability-lot.ps1

Melhorias aplicadas:
- validacao de parametros (SampleSize, timeout, retries, etc.);
- retries para chamadas GET/POST na API;
- tratamento de falhas de trigger por execucao;
- resiliencia em falhas de polling sem abortar lote inteiro;
- criacao automatica do diretorio de saida;
- resultado enriquecido com finalStatus, triggerFailureCount, pollFailureCount e missing.

Validacao:
- parse de sintaxe PowerShell concluido sem erro.

### 2) Planejamento operacional de hoje publicado
Arquivo criado: docs/d10-plano-execucao-hoje-2026-04-19.md

### 3) Rodadas de estabilidade executadas hoje
Artefatos gerados:
- maker-connect/docs/d10-t2-smoke-extended-result-r7-2026-04-19.json
- maker-connect/docs/d10-t2-smoke-extended-result-r7-2026-04-19-rerun300s.json

Resumo de execucao:
- rodada 120s: 1/5 done, 4/5 queued (comportamento parcial por janela curta);
- rodada 300s: 4/5 done, 1/5 queued ao fim da janela;
- verificacao apos janela: item restante (id 198) concluiu como done com latencyMs=309618.

Leitura tecnica:
- nao houve falha de trigger/polling no script (triggerFailureCount=0, pollFailureCount=0);
- houve conclusao tardia, consistente com gargalo de inferencia e nao com regressao de callback.

### 4) Benchmark comparativo ML-57 executado hoje
Artefatos gerados:
- maker-connect/docs/ml-57-benchmark-qwen2.5-7b-instruct-2026-04-19.json
- maker-connect/docs/ml-57-benchmark-llama3.1-8b-2026-04-19.json

Leitura tecnica resumida:
- Qwen2.5:7b-instruct manteve parse/schema em 100% e relevancia media 100% no v2, com p50 em 29.7s.
- Llama3.1:8b mostrou parse/schema 100% no v2, p50 em 26.4s e relevancia media 81.25%.
- O comparativo de hoje mostrou que o modelo alternativo instalável localmente melhora apenas parte do KPI, mas ainda fica acima da meta de 15s.

### 5) Jira status/comment bloqueado por visibilidade da issue
Tentativas feitas:
- ML-57, ML-56, ML-64 e ML-65 retornaram 404 no Jira REST.

Leitura operacional:
- o endpoint de comentario foi corrigido no helper local, mas o problema atual é que as issues de destino nao estao visiveis nessa credencial/instancia.
- acao recomendada: registrar o comentario final no resumo local de status e retentar apenas quando a chave Jira real estiver confirmada.

### 6) T3 retrieval/context pruning concluido
Arquivo de evidencia:
- maker-connect/docs/ml-67-retrieval-pruning-validation-10cases-2026-04-19.json
- maker-connect/docs/ml-67-retrieval-pruning-validation-10cases-2026-04-19.md

Resumo executivo:
- broad: parse 100%, schema 80%, p50 30068ms, p95 37823ms, relevancia media 70%, contexto medio 572 chars.
- pruned: parse 100%, schema 90%, p50 28187ms, p95 36423ms, relevancia media 72.5%, contexto medio 241 chars.
- delta pruned vs broad: +10pp schema, +2.5pp relevancia, -1881ms p50, -1400ms p95, -331 chars de contexto.

Leitura tecnica:
- pruning ajudou schema, relevancia e reduziu custo de contexto sem regressao de latencia.
- T3 confirma que o ajuste de retrieval esta no caminho certo, mas a relevancia ainda nao chegou no gate de 85%.
- proximo passo operacional e T4: benchmark final consolidado para decidir fechamento de ML-57 / ML-66 / ML-67.

### 7) T4 consolidado (benchmark final pos T1-T3)
Arquivo de consolidacao:
- docs/ml-57-benchmark-final-pos-t1-t3-2026-04-19.md

Decisao do ciclo:
- parse: GO
- schema: NO-GO (melhor caso 90%)
- relevancia: NO-GO (melhor caso 72.5%)
- latencia: NO-GO (p50/p95 acima da referencia de demo)

Recomendacao de status:
- manter ML-57 em In Progress com foco em retrieval scoring por dominio e curation de evidencias.

### 8) Novo ciclo de retrieval scoring por dominio iniciado e executado (ML-68)
Arquivos de evidencia:
- maker-connect/docs/ml-68-retrieval-domain-curation-validation-10cases-2026-04-19.json
- maker-connect/docs/ml-68-retrieval-domain-curation-validation-10cases-2026-04-19.md

Resumo do ciclo:
- parse 100%, schema 100%, p50 31.694s, p95 38.281s, relevancia media 92.5%.
- gate de relevancia (>=85%) atingido no lote de 10 casos.
- comparado ao T3 pruned: +20pp relevancia e +10pp schema, com aumento de latencia e contexto.

Leitura tecnica:
- estrategia de dominio + curadoria funcionou para qualidade (relevancia/schema),
- proximo ajuste deve focar em reduzir latencia sem perder cobertura de palavras-chave.

### 9) Microciclo C6/C10 executado
Arquivos de evidencia:
- maker-connect/docs/ml-69-microcycle-c6-c10-2026-04-19.json
- maker-connect/docs/ml-69-microcycle-c6-c10-2026-04-19.md
- maker-connect/docs/ml-69-microcycle-c6-c10-v2-2026-04-19.json
- maker-connect/docs/ml-69-microcycle-c6-c10-v2-2026-04-19.md
- maker-connect/docs/ml-69-microcycle-c6-c10-v3-2026-04-19.json
- maker-connect/docs/ml-69-microcycle-c6-c10-v3-2026-04-19.md

Leitura real:
- v1: parse/schema 100%, relevancia 75%, p50 32.213s, contexto 281 chars.
- v2: overconstraint derrubou parse/schema para 0% e nao trouxe ganho util.
- v3: parse/schema 100%, relevancia 87.5% (C6=75% e C10=100%), p50 36.605s, contexto 218 chars.
- conclusao: terceira iteracao equilibrada validou a estrategia para relevancia media (>=85), mas latencia ainda nao recuperou para a referencia de demo.

### 10) Proxima tarefa iniciada (T5)
- tarefa ativa: latency recovery focado em C6 com controle em C10.
- alvo: reduzir p50 abaixo do baseline v3 (36.605s) sem perder relevancia >=85%.
- plano de execucao: docs/ml-69-t5-latency-recovery-c6-2026-04-19.md

### 11) T5 v4 implementado e validado
Arquivos de evidencia:
- maker-connect/scripts/validate-retrieval-microcycle-c6-c10-v4.mjs
- maker-connect/docs/ml-69-microcycle-c6-c10-v4-2026-04-19.json
- maker-connect/docs/ml-69-microcycle-c6-c10-v4-2026-04-19.md

Resultado consolidado:
- parse 100%, schema 100%, relevancia 87.5%.
- p50/p95: 31.030s.
- melhoria vs v3: -5.575s em p50/p95, mantendo os gates de qualidade.

Leitura tecnica:
- uso de budget adaptativo e normalizacao estrutural apos parse estabilizou output e reduziu latencia do microciclo.

### 12) Adaptive 10 cases executado
Arquivos de evidencia:
- maker-connect/scripts/validate-retrieval-domain-curation-adaptive-10cases.mjs
- maker-connect/docs/ml-70-adaptive-domain-curation-validation-10cases-2026-04-19.json
- maker-connect/docs/ml-70-adaptive-domain-curation-validation-10cases-2026-04-19.md

Resumo executivo:
- parse 100%, schema 100%, relevancia 92.5%.
- p50 39.223s e p95 40.752s, acima do baseline curado (31.694s / 38.281s).
- conclusao: ganho de qualidade mantido, mas latencia piorou em escala.

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

### 14) Arquitetura aprovada com contraprova (ML-72)
Arquivos de evidencia:
- maker-connect/scripts/validate-retrieval-domain-curation-async-q4-10cases.mjs
- maker-connect/docs/ml-72-async-q4-parallel-cache-10cases-2026-04-19.json
- maker-connect/docs/ml-72-async-q4-parallel-cache-10cases-defaultprompt-2026-04-19.json
- docs/ml-72-plano-rollout-async-q4-2026-04-19.md

Resumo executivo da validacao:
- ciclo A (prompt agressivo, concorrencia 2): parse 90%, schema 90%, relevancia 82.5%, p50 64.764s, p95 71.101s (FAIL nos gates).
- ciclo B (prompt default, concorrencia 1): parse 100%, schema 100%, relevancia 92.5%, p50 31.912s, p95 35.786s (PASS nos gates).
- cache de embeddings validado: 352 hits, 0 misses no ciclo B.
- modelo q4 instalado e usado sem fallback global (fallbackCount=0).

Leitura tecnica:
- reducao drastica de prompt sem controle (aggressive) piora qualidade e estabilidade.
- com prompt default + fila assíncrona controlada (concorrencia 1), os gates voltam ao nivel do baseline curado com p95 melhor.
- paralelismo maior neste hardware local aumentou latencia e risco de timeout; o tuning de concorrencia deve ser por ambiente.

Decisao recomendada:
- seguir com arquitetura async em fila e cache de embeddings, mantendo prompt default como padrao inicial.
- liberar concorrencia de forma gradual (1 -> 2 -> 3) apenas com monitoramento de p95, parse e schema.

## Tarefa especifica iniciada (recomendada)
Preparacao do pacote de tuning para ML-57 (Phase 2), com checklist e criterio de sucesso.
Arquivo: docs/ml-57-phase2-tuning-checklist-2026-04-19.md

## Comando padrao para rerun operacional

```powershell
pwsh -NoProfile -File .\scripts\run-stability-lot.ps1 `
  -ApiUrl "http://localhost:3000" `
  -ProjectId 7 `
  -Label r7 `
  -SampleSize 5 `
  -MaxObserveSeconds 300 `
  -OutputPath ".\maker-connect\docs\d10-t2-smoke-extended-result-r7-2026-04-19.json"
```

## Registro para Jira (rascunho curto)
"D10 follow-up 2026-04-19: script de smoke reforcado com retries e consolidacao de falhas; rodada r7 executada (5 triggers sem erro, conclusoes tardias por latencia de inferencia). ML-56 permanece estavel. ML-57 segue bloqueado por tuning de LLM (latencia/relevancia)."

## Bloqueadores em aberto
- Performance de inferencia local (CPU) ainda acima da referencia de demo.
- Relevancia depende de prompt tuning e refinamento de estrategia de embeddings.
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
- fila de exportacao migrada para Redis/BullMQ em maker-connect/lib/pdf-export-queue.ts;
- endpoint de exportacao ajustado para enfileirar jobs e retornar queueJobId;
- runner progressivo 1 -> 2 -> 3 criado para governar rollout por gates;
- Redis local iniciado com docker compose e dependencias de fila instaladas;
- benchmark progressivo executado e parado no degrau 1 por gate de parse/schema.

Resultado consolidado do rollout progressivo:
- concorrencia 1: parse 90%, schema 90%, relevancia 82.5%, p50 30.563s, p95 33.962s;
- gate de qualidade nao liberado para os proximos degraus;
- arquivos de evidencia gerados em docs/ml-72-progressive-concurrency-gate-report-2026-04-19.json e .md.

Fechamento para o dia:
- tuning puro encerrado como NO-GO definitivo;
- arquitetura async com fila e cache aprovada como direcao correta, mas ainda depende de ajuste para reabrir o rollout progressivo;
- proximo passo de engenharia: estabilizar parse/schema em baseline q4 + prompt default e entao tentar concorrencia 2.

## 15) Encerramento do dia e plano de amanha

- Status recomendado para Jira: ML-66 CLOSED NO-GO, ML-57 In Progress, ML-72 In Progress com bloqueio de gate em concorrencia 1;
- plano de amanha registrado em docs/d10-plano-execucao-amanha-2026-04-20.md;
- foco de amanha: reparo do baseline de parse/schema, smoke end-to-end da fila Redis/BullMQ e nova tentativa de rollout progressivo.
