# Snapshot Parcial de Metricas IA - D5 (2026-04-17)

## Objetivo
Consolidar metricas parciais para o gate D5 (mid-demo), conforme checklist de qualidade da sprint.

## Fonte dos dados
- Origem: tabela `ProjectExtractionLog` (Prisma)
- Janela de analise: ultimos 50 logs
- Amostra valida para latencia/parse: 16 logs com status `done` e `latencyMs` definido

## Resultado (parcial)
- p50 de latencia: 20.763 ms
- p95 de latencia: 69.193 ms
- Taxa de parse com sucesso: 100%
- Relevancia media normalizada: 80,69%
  - Min: 8,50%
  - Max: 100%

## Leitura rapida
- Parse JSON: estavel no recorte analisado.
- Latencia: acima da referencia de demo (< 15s) neste snapshot.
- Relevancia: proxima da meta, mas ainda abaixo do alvo de 85% no agregado desta amostra.

## Observacoes
- Amostra inclui execucoes heterogeneas (testes manuais e callbacks de validacao).
- O valor de relevancia e normalizado para percentual quando a origem vem em escala 0..1.
- Este relatorio e parcial (D5) e serve para orientar tuning antes do gate D10.

## Proximo passo tecnico
- Segmentar benchmark por cenario (somente execucoes n8n reais sem callback forcado) para reduzir ruido e medir p50/p95 real de operacao.
