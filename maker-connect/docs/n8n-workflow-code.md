# Código n8n - Fluxo de Extração

## 🚀 VERSÃO 3 (RAG Real) - Recomendada
Esta versão integra-se oficialmente com a OpenAI para gerar embeddings e requisitos técnicos fundamentados (RAG).

### Passo 1: Import JSON
Abra [`docs/n8n-workflow-v3-rag.json`](./n8n-workflow-v3-rag.json), copie o conteúdo e importe no n8n.

### Passo 2: Configurar Credenciais
1. No n8n, vá em **Credentials** -> **Add Credential**.
2. Procure por **OpenAI API**.
3. Insira sua `API Key`.
4. Nos nós **OpenAI Embeddings** e **OpenAI RAG**, selecione a credencial que você criou.

### Passo 3: Ativar
Clique no botão **Activate** no topo do workflow.

---

## 🏗️ VERSÃO 2 (Simulação Determinística)
Ideal para testes locais sem necessidade de chaves de API externas.

### Passo 1: Import JSON
Abra [`docs/n8n-workflow-export.json`](./n8n-workflow-export.json) e importe no n8n.

---

## 🛠️ Detalhes dos Nós (Versão 3)

### Nó: OpenAI Embeddings
- **Model**: `text-embedding-3-small`
- **Purpose**: Transforma as palavras-chave extraídas em vetores para futura busca em base de componentes.

### Nó: OpenAI RAG
- **Model**: `gpt-4o`
- **System Prompt**: Atua como um especialista Maker Professional.
- **Output**: JSON estruturado com requisitos técnicos e sugestão de BOM.

---

## TESTES

### Teste 1: Extrair Projeto (Trigger via API)
```bash
curl -X POST http://localhost:3000/api/projects/1/extract \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Projeto de automação residencial com ESP32 e relés para controle de lâmpadas via WiFi.",
    "source": "manual"
  }'
```

---

## Arquivos de Referência

- **V3 (RAG Real)**: [`docs/n8n-workflow-v3-rag.json`](./n8n-workflow-v3-rag.json)
- **V2 (Simulação)**: [`docs/n8n-workflow-export.json`](./n8n-workflow-export.json)
- **Guia Completo**: [`docs/n8n-integration-guide.md`](./n8n-integration-guide.md)
- **Endpoints**: `POST /api/projects/[id]/extract` + `POST /api/projects/[id]/extract/callback`

