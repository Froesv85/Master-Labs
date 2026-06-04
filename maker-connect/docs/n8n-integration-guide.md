# Integração n8n - Webhook de Extração Técnica

## Status da Implementação

✅ Backend API:
- Endpoint POST `/api/projects/[id]/extract` dispara webhook para n8n
- Endpoint POST `/api/projects/[id]/extract/callback` recebe resultado de n8n
- Endpoint GET `/api/projects/[id]/extract` lista logs de execução
- Modelo `ProjectExtractionLog` persiste status e metadados

✅ Variáveis de ambiente configuradas:
- `N8N_EXTRACTION_WEBHOOK_URL=http://localhost:5678/webhook/extraction`
- `API_URL=http://localhost:3000`

---

## Guia: Criar Workflow no n8n

### Passo 1: Acessar n8n
1. Abra http://localhost:5678/home/workflows
2. Login com `froesv@gmail.com` / `Fusca@34`
3. Clique em **+ New** para criar novo workflow

### Passo 2: Configurar Trigger (Webhook)
1. Pesquise por **Webhook** trigger
2. Configure:
   - **HTTP Method**: POST
   - **Path**: `/extraction` (vai gerar URL completa)
   - **Salve** (Copie a URL do webhook disparado)

### Passo 3: Teste Rápido do Webhook
Antes de continuar, execute:
```bash
curl -X POST http://localhost:5678/webhook/test/extraction \
  -H "Content-Type: application/json" \
  -d '{
    "webhookId": "webhook_test_123",
    "projectId": 1,
    "input": "Arduino Uno com sensor DHT22 conectado via UART"
  }'
```

### Passo 4: Adicionar Nó de Processing (Simples por enquanto)
1. Adicione um nó **Code** (JavaScript)
2. Configure para processar payload e criar resposta:
```javascript
// Extrair dados do webhook (n8n v2 wraps POST body inside .body)
const triggerItem = $input.first().json;
const payload = triggerItem.body ?? triggerItem;
const { webhookId, projectId, projectTitle, input, keywords, piiRedactions, embeddingId, callbackUrl } = payload;

const safeInput = typeof input === 'string' ? input : '';
const safeKeywords = Array.isArray(keywords) ? keywords : [];
const safePiiRedactions = Number.isFinite(Number(piiRedactions)) ? Number(piiRedactions) : 0;

return [{
  json: {
    webhookId,
    projectId,
    projectTitle,
    embeddingId,
    callbackUrl,
    extractionMetrics: {
      inputLength: safeInput.length,
      keywordsCount: safeKeywords.length,
      piiRedactionsFound: safePiiRedactions,
      processingTimestamp: new Date().toISOString()
    },
    keywords: safeKeywords,
    input: safeInput
  }
}];
```

### Passo 5: Adicionar Nó de Callback (HTTP Request)
1. Adicione um nó **HTTP Request**
2. Configure:
   - **Method**: POST
   - **URL**: `{{ $input.body.callbackUrl }}`
   - **Headers**: 
     ```
     Content-Type: application/json
     ```
   - **Body** (JSON mode):
     ```json
     {
       "webhookId": "{{ $input.body.webhookId }}",
       "status": "done",
       "n8nExecutionId": "{{ $execution.id }}",
       "latencyMs": {{ Date.now() - Date.parse($execution.startTime) }},
       "output": {{ $node["Code"].json }}
     }
     ```

### Passo 6: Ativar Workflow
1. Clique em **Activate** (canto superior direito)
2. Confirme ativação

---

## Teste E2E

### Teste 1: Disparar Extração Manual
```bash
curl -X POST http://localhost:3000/api/projects/1/extract \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Sistema embarcado com Raspberry Pi 4, sensor de temperatura BMP280, comunicação WiFi via ESP8266. Problema encontrado: latência de 500ms na leitura serial. Solução: buffer pequeno (16 bytes) ajustado para 2048 bytes.",
    "source": "manual"
  }'
```

**Resposta esperada:**
```json
{
  "data": {
    "logId": 1,
    "projectId": 1,
    "webhookId": "webhook_1712517600123_abc12345",
    "embeddingId": "emb_1_3x7y8z_1a2b3c4d5e",
    "status": "queued",
    "source": "manual",
    "piiRedactions": 0,
    "keywords": ["raspberry", "sensor", "temperatura", "comunicação"],
    "message": "Extracao iniciada no pipeline n8n."
  }
}
```

### Teste 2: Consultar Logs
```bash
curl -X GET http://localhost:3000/api/projects/1/extract
```

**Resposta esperada:**
```json
{
  "data": [
    {
      "id": 1,
      "status": "done",
      "webhookId": "webhook_1712517600123_abc12345",
      "source": "manual",
      "piiRedactions": 0,
      "keywords": ["raspberry", "sensor", "temperatura"],
      "embeddingId": "emb_1_3x7y8z_1a2b3c4d5e",
      "latencyMs": 245,
      "n8nExecutionId": "12345",
      "output": {
        "inputLength": 180,
        "keywordsCount": 4,
        "processedAt": "2026-04-07T22:40:00.123Z"
      },
      "error": null,
      "createdAt": "2026-04-07T22:40:00.000Z",
      "updatedAt": "2026-04-07T22:40:00.245Z"
    }
  ]
}
```

---

## Próximas Integrações (S1.2+)

- [ ] Conectar Pinecone/Supabase para embeddings
- [ ] Adicionar nó de extração de keywords avançada
- [ ] Implementar RAG com busca vetorial
- [ ] Adicionar guardrails de LGPD com PII masking no n8n
- [ ] Integrar LLM (GPT-4o ou Llama 3) para análise contextual
- [ ] Adicionar PDF generation no workflow

---

## Debug

Se webhook não disparar, verifique:
1. N8n ativo: `docker-compose ps` (procure por n8n)
2. URL webhook configurada em `.env.local`
3. Workflow ativado no n8n (botão verde no topo)
4. Logs no n8n: http://localhost:5678/workflow/execution-list

Caso receba erro de conexão:
```bash
# Teste conexão com n8n
curl http://localhost:5678/rest/health
```

---

## Arquivo de Referência

Documento de planejamento: [docs/cronograma-sprint-detalhado.md](../../cronograma-sprint-detalhado.md)  
Story mapeada: S1.1-E1-H1-T1 (Webhook endpoint + Embeddings Pipeline)
