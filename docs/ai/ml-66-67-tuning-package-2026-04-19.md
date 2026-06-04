# ML-66/67 Tuning Package - 2026-04-19

## Objetivo
Transformar o comparativo de hoje em um pacote executavel para o proximo ciclo de tuning:
- T2: prompt pack domain-specific maker IoT
- T3: retrieval / context budget optimization

## Baseline de referencia
Fonte: [docs/ml-57-benchmark-comparativo-2026-04-19.md](docs/ml-57-benchmark-comparativo-2026-04-19.md)

- qwen2.5:7b-instruct: parse/schema 100%, p50 29.729s, p95 29.804s, relevancia 100%
- llama3.1:8b: parse/schema 100%, p50 26.380s, p95 26.909s, relevancia 81.25%

## T2 - Prompt pack domain-specific maker IoT

### Hipotese
Um prompt mais curto, com schema estrito e exemplos maker IoT reais, aumenta relevancia sem piorar parse.

### Regras do prompt v3
- Responder somente JSON valido em pt-BR.
- Usar `schemaVersion: mc_extract_v2`.
- Limitar `technicalRequirements` a 3-5 itens.
- Limitar `suggestedBOM` a 3-5 itens.
- `suggestedCode` deve ser string vazia quando nao houver codigo.
- `quantity` sempre como string.
- `priority` apenas `high`, `medium` ou `low`.
- Nao adicionar campos extras.

### 10 casos de validacao
1. Estacao meteorologica ESP32 com DHT22 e OLED.
2. Irrigacao automatica com sensor de umidade, rele e bomba.
3. Monitoramento de vibracao com MPU6050, RTC e bateria.
4. Iluminacao residencial com ESP8266, PIR e fallback local.
5. Controle de motores com ponte H e limite de corrente.
6. Telemetria MQTT com Wi-Fi instavel e reconexao.
7. Coleta de dados de bateria com alerta de baixa tensao.
8. Projeto com notas de manutencao e log de falhas.
9. Leitura de sensores analogicos com filtro e calibração.
10. Sistema com PII a anonimizar e saida auditavel.

### Criterios de sucesso T2
- parse valid >= 95%
- schema valid >= 95%
- relevancia media >= 85%
- sem regressao material de latencia em relacao ao baseline escolhido

## T3 - Retrieval / Context Budget Optimization

### Hipotese
Reduzir ruido de contexto e ajustar top-k/chunking melhora relevancia sem inflar custo de tokens.

### Ajustes a testar
- top-k menor para filtros de contexto mais limpos.
- chunking menor para evidencias tecnicas curtas.
- poda de contexto repetido entre datasheets e exemplos.
- prioridade para evidencias do mesmo tipo de projeto (sensors/actuation/connectivity).

### Sinais a medir
- taxa de keyword coverage por caso.
- relevancia por amostra.
- tamanho medio do contexto enviado.
- parse success por caso.

### Critérios de sucesso T3
- aumento de relevancia media em relacao ao baseline T2.
- mesma taxa de parse/schema ou melhor.
- reducao do volume de contexto sem perda de cobertura tecnica.

### Resultado executado em 2026-04-19
- broad: parse 100%, schema 80%, p50 30068ms, p95 37823ms, relevancia 70%, contexto medio 572 chars.
- pruned: parse 100%, schema 90%, p50 28187ms, p95 36423ms, relevancia 72.5%, contexto medio 241 chars.
- delta: +10pp schema, +2.5pp relevancia, -1881ms p50, -1400ms p95, -331 chars de contexto.
- leitura: o pruning trouxe ganho real, mas a relevancia segue abaixo do gate final de 85%.

## Proximo passo operacional
1. Aplicar T2 com os 10 casos.
2. Medir relevancia por caso e registrar deltas.
3. Aplicar T3 com contexto reduzido.
4. Reexecutar comparativo completo para fechar a decisao de ML-66/ML-67.
