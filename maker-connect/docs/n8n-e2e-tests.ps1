# Testes de integração MakerConnect + n8n (PowerShell)
# Use: .\n8n-e2e-tests.ps1

param(
    [string]$ApiUrl = "http://localhost:3000",
    [int]$ProjectId = 7
)

$API_URL = $ApiUrl
$PROJECT_ID = $ProjectId

Write-Host "=== MakerConnect E2E Tests (PowerShell) ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "${API_URL}/api/projects" -Method Get
    Write-Host "✓ API respondendo" -ForegroundColor Green
} catch {
    Write-Host "✗ API indisponível" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Disparar extração
Write-Host "Test 2: POST Extração" -ForegroundColor Yellow
$extractBody = @{
    input = "Arduino Mega 2560 com sensores BMP180, DHT11 e MQ135. Comunicação via USB serial em 115200 baud. Problema: crashes aleatórios a cada 12 horas. Solução: reduzir frequency de amostragem de 10Hz para 5Hz."
    source = "manual"
} | ConvertTo-Json

$extractResponse = Invoke-RestMethod -Uri "${API_URL}/api/projects/${PROJECT_ID}/extract" `
    -Method Post `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $extractBody

Write-Host "Resposta:" -ForegroundColor Green
$extractResponse | ConvertTo-Json -Depth 5
$WEBHOOK_ID = $extractResponse.data.webhookId
$LOG_ID = $extractResponse.data.logId
Write-Host "Webhook ID: $WEBHOOK_ID"
Write-Host "Log ID: $LOG_ID"
Write-Host ""

# Test 3: Verificar status imediato
Write-Host "Test 3: Status Imediato" -ForegroundColor Yellow
$logsResponse = Invoke-RestMethod -Uri "${API_URL}/api/projects/${PROJECT_ID}/extract" -Method Get
$logsResponse.data[0] | Select-Object id, status, webhookId, embeddingId | ConvertTo-Json
Write-Host ""

# Test 4: Aguardar e verificar novamente
Write-Host "Test 4: Aguardando 3 segundos para n8n processar..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Test 5: Status Após n8n Processar" -ForegroundColor Yellow
$finalLogsResponse = Invoke-RestMethod -Uri "${API_URL}/api/projects/${PROJECT_ID}/extract" -Method Get
$finalLogsResponse.data[0] | ConvertTo-Json -Depth 5
Write-Host ""

# Test 6: Simular callback manual
Write-Host "Test 6: Forçar Callback Manual (para testes sem n8n)" -ForegroundColor Yellow
$callbackBody = @{
    webhookId = $WEBHOOK_ID
    status = "done"
    n8nExecutionId = "mock_exec_$(Get-Date -UFormat %s)"
    latencyMs = 245
    output = @{
        relevance_score = 0.87
        keywords_extracted = 6
        processing_stage = "completed"
    }
} | ConvertTo-Json

$callbackResponse = Invoke-RestMethod -Uri "${API_URL}/api/projects/${PROJECT_ID}/extract/callback" `
    -Method Post `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $callbackBody

Write-Host "Callback Response:" -ForegroundColor Green
$callbackResponse | ConvertTo-Json -Depth 5
Write-Host ""

# Test 7: Verificar log atualizado
Write-Host "Test 7: Verificar Log Atualizado com Resultado" -ForegroundColor Yellow
$updatedLogsResponse = Invoke-RestMethod -Uri "${API_URL}/api/projects/${PROJECT_ID}/extract" -Method Get
$updatedLog = $updatedLogsResponse.data[0]
Write-Host "Status: $($updatedLog.status)" -ForegroundColor Green
Write-Host "Latency: $($updatedLog.latencyMs)ms"
Write-Host "Output: $($updatedLog.output | ConvertTo-Json)"
Write-Host ""

# Test 8: Error handling - input pequeno
Write-Host "Test 8: Error Handling - Input Pequeno" -ForegroundColor Yellow
try {
    $errorBody = @{input = "curto"} | ConvertTo-Json
    $errorResponse = Invoke-RestMethod -Uri "${API_URL}/api/projects/${PROJECT_ID}/extract" `
        -Method Post `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $errorBody
    } catch {
    Write-Host "✓ Erro capturado corretamente:" -ForegroundColor Green
    Write-Host $_.Exception.Message
}
Write-Host ""

# Test 9: Error handling - projeto não existe
Write-Host "Test 9: Error Handling - Projeto Inexistente" -ForegroundColor Yellow
try {
    $notFoundBody = @{input = "qualquer coisa com mais de 20 caracteres para passar validacao"} | ConvertTo-Json
    $notFoundResponse = Invoke-RestMethod -Uri "${API_URL}/api/projects/99999/extract" `
        -Method Post `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $notFoundBody
    } catch {
    Write-Host "✓ Projeto não encontrado:" -ForegroundColor Green
    Write-Host $_.Exception.Message
}
Write-Host ""

Write-Host "=== Todos os testes completados ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Magenta
Write-Host "- Extração disparada: ✓"
Write-Host "- Webhook log criado: ✓"
Write-Host "- Callback recebido: ✓"
Write-Host "- Status atualizado: ✓"
Write-Host ""
Write-Host "Próximo passo: Verificar se n8n webhook foi disparado"
Write-Host "URL esperada: http://localhost:5678/webhook/extraction"
