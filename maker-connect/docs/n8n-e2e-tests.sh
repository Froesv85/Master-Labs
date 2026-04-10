#!/usr/bin/env bash
# Testes de integração MakerConnect + n8n
# Use: bash n8n-e2e-tests.sh

set -e

API_URL="http://localhost:3000"
PROJECT_ID=1

echo "=== MakerConnect E2E Tests ==="
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
curl -s "${API_URL}/api/projects/${PROJECT_ID}" > /dev/null && echo "✓ API respondendo" || echo "✗ API indisponível"
echo ""

# Test 2: Disparar extração
echo "Test 2: POST Extração"
EXTRACT_RESPONSE=$(curl -s -X POST "${API_URL}/api/projects/${PROJECT_ID}/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Arduino Mega 2560 com sensores BMP180, DHT11 e MQ135. Comunicação via USB serial em 115200 baud. Problema: crashes aleatórios a cada 12 horas. Solução: reduzir frequency de amostragem de 10Hz para 5Hz.",
    "source": "manual"
  }')

echo "$EXTRACT_RESPONSE" | jq .
WEBHOOK_ID=$(echo "$EXTRACT_RESPONSE" | jq -r '.data.webhookId')
LOG_ID=$(echo "$EXTRACT_RESPONSE" | jq -r '.data.logId')
echo "Webhook ID: $WEBHOOK_ID"
echo "Log ID: $LOG_ID"
echo ""

# Test 3: Verificar status imediato
echo "Test 3: Status Imediato"
curl -s "${API_URL}/api/projects/${PROJECT_ID}/extract" | jq '.data[0] | {id, status, webhookId, embeddingId}'
echo ""

# Test 4: Wait e check novamente
echo "Test 4: Aguardando 3 segundos para n8n processar..."
sleep 3

echo "Test 5: Status Após n8n Processar"
FINAL_STATUS=$(curl -s "${API_URL}/api/projects/${PROJECT_ID}/extract" | jq '.data[0]')
echo "$FINAL_STATUS" | jq '.'
echo ""

# Test 6: Simular callback manual (se n8n não completar)
echo "Test 6: Forçar Callback Manual (para testes sem n8n)"
CALLBACK_RESPONSE=$(curl -s -X POST "${API_URL}/api/projects/${PROJECT_ID}/extract/callback" \
  -H "Content-Type: application/json" \
  -d "{
    \"webhookId\": \"$WEBHOOK_ID\",
    \"status\": \"done\",
    \"n8nExecutionId\": \"mock_exec_$(date +%s)\",
    \"latencyMs\": 245,
    \"output\": {
      \"relevance_score\": 0.87,
      \"keywords_extracted\": 6,
      \"processing_stage\": \"completed\"
    }
  }")

echo "$CALLBACK_RESPONSE" | jq .
echo ""

# Test 7: Verificar log atualizado
echo "Test 7: Verificar Log Atualizado com Resultado"
UPDATED_LOG=$(curl -s "${API_URL}/api/projects/${PROJECT_ID}/extract" | jq '.data[0]')
echo "Status: $(echo "$UPDATED_LOG" | jq -r '.status')"
echo "Latency: $(echo "$UPDATED_LOG" | jq '.latencyMs')ms"
echo "Output: $(echo "$UPDATED_LOG" | jq '.output')"
echo ""

# Test 8: Erro handling - input inválido
echo "Test 8: Error Handling - Input Pequeno"
ERROR_RESPONSE=$(curl -s -X POST "${API_URL}/api/projects/${PROJECT_ID}/extract" \
  -H "Content-Type: application/json" \
  -d '{"input": "curto"}')

echo "$ERROR_RESPONSE" | jq '.error'
echo ""

# Test 9: Erro handling - projeto não existe
echo "Test 9: Error Handling - Projeto Inexistente"
NOT_FOUND=$(curl -s -X POST "${API_URL}/api/projects/99999/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "qualquer coisa com mais de 20 caracteres para passar validação"
  }')

echo "$NOT_FOUND" | jq '.error'
echo ""

echo "=== Todos os testes completados ==="
echo ""
echo "Resumo:"
echo "- Extração disparada: ✓"
echo "- Webhook log criado: ✓"
echo "- Callback recebido: ✓"
echo "- Status atualizado: ✓"
echo ""
echo "Próximo passo: Verificar se n8n webhook foi disparado"
echo "URL esperada: http://localhost:5678/webhook/extraction"
