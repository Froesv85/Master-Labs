# D10 - Pacote de Correcoes (Relevancia + Latencia)

## Escopo
Pacote aplicado para estabilizar o fluxo principal e preparar rerun final de benchmark.

## Arquivo ajustado
- maker-connect/docs/n8n-workflow-v3-rag-ollama.json

## Correcoes implementadas
1. Normalizacao de entrada no node Process Input
- `input` sanitizado com trim.
- `keywords` limitadas aos 12 primeiros termos validos.
- Novo campo `embeddingPrompt` com fallback para input e limite de 600 chars.

2. Embeddings com fallback robusto
- Node de embeddings agora usa `embeddingPrompt || input`.
- Evita consultas vazias quando keywords vierem ausentes.

3. Prompt de geracao mais curto e deterministico
- Prompt reduzido e estruturado para JSON estrito.
- Grounding limitado a top 3 evidencias e 320 chars por evidencia.
- Contexto de usuario limitado a 800 chars.
- Regras claras de schema e limite de itens.
- Opcoes de modelo ajustadas: `temperature 0.1`, `num_predict 260`.

4. Pos-processamento com normalizacao de confidenceScore
- Padronizacao para faixa 0..100.
- Conversao automatica quando score vier em 0..1.
- Truncagem de arrays para no maximo 6 itens.
- Campo `parseError` explicito para rastreio de falha de parse.

## Objetivo esperado no rerun
- Melhor consistencia de schema JSON.
- Menor variabilidade de latencia por reducao de contexto e output.
- Melhor comparabilidade de relevancia pela escala padronizada de confidenceScore.

## Proximo passo operacional
1. Reimportar/ativar o workflow atualizado no n8n.
2. Rodar benchmark de rerun final (mesma amostra de 10 execucoes).
3. Comparar p50/p95/relevancia com o baseline do relatorio D10-T1.
