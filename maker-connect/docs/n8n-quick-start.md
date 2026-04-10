# Código Pronto para n8n - Resumo Rápido

## 📋 Resumo
Você possui 3 arquivos prontos para usar:

| Arquivo | Uso | Formato |
|---------|-----|---------|
| **n8n-workflow-export.json** | Import direto no n8n | JSON (Ctrl+C no arquivo) |
| **n8n-workflow-code.md** | Construir manual + scripts | Markdown com código |
| **n8n-e2e-tests.ps1** | Testar integração | PowerShell pronto |

---

## 🚀 START RÁPIDO (5 minutos)

### Passo 1: Copiar JSON
```
Arquivo: docs/n8n-workflow-export.json
Copie todo o conteúdo
```

### Passo 2: Importar no n8n
1. Acesse http://localhost:5678/home/workflows
2. Clique botão **+** (novo workflow)
3. Menu **...** → **Import from URL**
4. Cole o JSON
5. Clique **Import**
6. Clique **Activate** (botão verde no topo)

### Passo 3: Testar
```powershell
# Abra PowerShell no maker-connect
cd docs
.\n8n-e2e-tests.ps1
```

---

## 🔧 Construir Manual (alternativa)

Se preferir construir passo-a-passo, siga [n8n-workflow-code.md](./n8n-workflow-code.md).

Os 3 nós principais são:

### Nó 1: Webhook Trigger
```
Type: Webhook
Path: /extraction
Method: POST
```

### Nó 2: Code (Processamento)
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

### Nó 3: HTTP Callback
```
Type: HTTP Request
Method: POST
URL: {{ $input.previous.json.callbackUrl }}

Body (Raw JSON):
{
  "webhookId": "{{ $input.previous.json.json.webhookId }}",
  "status": "done",
  "n8nExecutionId": "{{ $execution.id }}",
  "latencyMs": {{ Date.now() - Date.parse($execution.startTime) }},
  "output": {{ JSON.stringify($input.previous.json.json.extractionMetrics) }}
}
```

---

## ✅ Testar Após Setup

### Teste 1: Disparar Extração
```powershell
$body = @{
    input = "Arduino Mega 2560 com sensores BMP180. Problema: crashes. Solução: reduzir sampling de 10Hz para 5Hz."
    source = "manual"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/projects/1/extract" `
    -Method Post `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $body | ConvertTo-Json
```

### Teste 2: Consultar Logs
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/projects/1/extract" `
    -Method Get | ConvertTo-Json -Depth 5
```

### Teste 3: Simular Callback (se n8n não responder)
```powershell
$callbackBody = @{
    webhookId = "webhook_123_abc"  # Use o webhookId do Teste 1
    status = "done"
    n8nExecutionId = "exec_12345"
    latencyMs = 250
    output = @{
        relevance = 0.87
        keywords = 5
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/projects/1/extract/callback" `
    -Method Post `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $callbackBody | ConvertTo-Json
```

---

## 📁 Estrutura de Arquivos

```
maker-connect/docs/
├── n8n-workflow-export.json          ← JSON pronto para import
├── n8n-workflow-code.md              ← Guia de construção manual
├── n8n-e2e-tests.ps1                 ← Script de testes completo
├── n8n-integration-guide.md          ← Documentação detalhada
└── n8n-quick-start.md                ← Este arquivo
```

---

## 🐛 Troubleshooting

**Webhook retorna 404**
→ Confirme workflow está **Activated** (botão verde)

**Callback não atualiza log**
→ Verifique se `callbackUrl` está sendo passado corretamente no POST

**Erro "Invalid JSON"**
→ Use aspas duplas em JSON (PowerShell escapa automático)

---

## 📞 Status de Integração

- ✅ Backend pronto
- ✅ Webhook disparador criado
- ✅ Callback endpoint implementado
- ✅ Logs persistidos em BD
- ⏳ n8n workflow a configurar
- ⏳ Integração com embeddings (próximo: S1.2)

---

## 🎯 Próximos Passos

1. **Hoje**: Importar workflow + testar
2. **Amanhã**: Adicionar embeddings (Pinecone/Supabase)
3. **Próxima semana**: RAG + LGPD pipeline completo

Arquivo de referência: [cronograma-sprint-detalhado.md](../../docs/cronograma-sprint-detalhado.md) (S1.1)
