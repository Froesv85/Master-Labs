# Fase 2 - Plano Operacional (LLM Latency & Relevance)

Data: 2026-04-18
Escopo: execução das próximas etapas após fechamento do gate de estabilidade.

## 1) Status Jira consolidado

- Epic: ML-64 (`Phase 2 - LLM Latency & Relevance Tuning`)
- Blocker: ML-65 (`Requires LLM Optimization (Phase 2)`)
- Task ativa: ML-66 (`Prompt & Output Schema Tuning`) -> **Em andamento**
- Próximas tasks: ML-67, ML-68, ML-69 -> **Tarefas pendentes**
- Card dependente: ML-57 -> **Em andamento** (bloqueado até atingir KPIs)

## 2) Sequência recomendada de execução

1. ML-66 - Prompt & Output Schema Tuning
2. ML-67 - Retrieval & Context Budget Optimization
3. ML-68 - Ollama Runtime Performance Optimization
4. ML-69 - Benchmark Harness & KPI Validation Reruns

Motivo da ordem:
- primeiro melhora qualidade semântica e consistência de saída,
- depois otimiza recuperação/contexto,
- então atua em performance de runtime,
- por fim valida tudo em benchmark controlado.

## 3) Definição de pronto por task

### ML-66 (em andamento)
Objetivo:
- elevar relevância via prompt mais estrito e schema JSON único.

Entrega mínima:
- prompt v2 documentado,
- parser aceitando apenas schema definido,
- comparação baseline vs v2 em amostra fixa.

Critério de aceite:
- parse válido >= 95%,
- melhora mensurável de relevância vs baseline.

### ML-67
Objetivo:
- melhorar precisão de retrieval e reduzir ruído de contexto.

Entrega mínima:
- ajuste de top-k,
- estratégia de chunking/rechunking,
- regra de poda de contexto.

Critério de aceite:
- relevância intermediária >= 70%,
- menor volume de contexto enviado ao modelo.

### ML-68
Objetivo:
- reduzir latência fim a fim do pipeline.

Entrega mínima:
- parâmetros runtime ajustados (ex.: contexto, temperatura, warmup),
- teste de concorrência/filas n8n.

Critério de aceite:
- p50 <= 45s,
- p95 <= 70s (meta intermediária antes do alvo final).

### ML-69
Objetivo:
- validar ganhos e decidir pass/fail final de KPI.

Entrega mínima:
- benchmark reproduzível com 10 execuções,
- relatório canônico com p50/p95/relevance/parse.

Critério de aceite:
- relatório publicado em docs,
- decisão objetiva de readiness para desbloquear ML-57.

## 4) Meta final de desbloqueio (ML-57)

Para remover bloqueio:
- P50 < 15s
- P95 < 15s
- Relevância >= 85%
- Parse >= 95%

## 5) Plano tático de 3 dias

Dia 1:
- finalizar ML-66 (prompt v2 + schema)
- evidência em documento de comparação

Dia 2:
- executar ML-67 (retrieval tuning)
- iniciar ML-68 (runtime tuning)

Dia 3:
- fechar ML-68
- rodar ML-69 com benchmark completo
- atualizar status de ML-57 com evidências

## 6) Riscos e mitigação imediata

Risco 1:
- melhora de relevância aumenta latência.
Mitigação:
- controlar orçamento de contexto e limitar top-k.

Risco 2:
- parse regressivo ao endurecer prompt.
Mitigação:
- validação de schema no pós-processamento.

Risco 3:
- resultados variáveis entre rodadas.
Mitigação:
- benchmark com amostra fixa e janela observável padronizada.

## 7) Próxima ação já iniciada

- ML-66 foi movida para **Em andamento** e recebeu comentário de kickoff no Jira.
