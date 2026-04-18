# Runbook de Implantacao - Ollama no MakerConnect

## Stack escolhido
- Embedding: `bge-m3`
- Geracao: `qwen2.5:7b-instruct`
- Fallback de geracao: `llama3.1:8b`

## Objetivo
Subir Ollama localmente, validar os modelos e preparar o ambiente para trocar Gemini por Ollama no n8n e no seed de Pinecone.

## 1) Instalacao do Ollama
1. Instale o Ollama na maquina ou no host que vai executar o pipeline.
2. Confirme que o servico esta disponivel em `http://localhost:11434`.
3. Valide a lista de modelos:
```bash
curl http://localhost:11434/api/tags
```

## 2) Baixar modelos
Execute nesta ordem:
```bash
ollama pull bge-m3
ollama pull qwen2.5:7b-instruct
ollama pull llama3.1:8b
```

## 3) Validar embeddings
Teste um embedding simples:
```bash
curl http://localhost:11434/api/embeddings -H "Content-Type: application/json" -d "{\"model\":\"bge-m3\",\"prompt\":\"ESP32 com sensor DHT22\"}"
```

Resultado esperado:
- resposta JSON com vetor em `embedding`;
- resposta sem erro HTTP;
- tempo aceitavel para ambiente local.

## 4) Validar geracao
Teste a geracao com saida JSON:
```bash
curl http://localhost:11434/api/generate -H "Content-Type: application/json" -d "{\"model\":\"qwen2.5:7b-instruct\",\"prompt\":\"Responda apenas em JSON com keys technicalRequirements e suggestedBOM para um projeto com ESP32 e DHT22\",\"stream\":false}"
```

Resultado esperado:
- retorno textual consistente;
- conteudo com JSON estrito ou facil de normalizar no parser;
- sem dependencia de Gemini.

## 5) Variaveis de ambiente do projeto
Defina no ambiente do n8n e dos scripts:
- `OLLAMA_BASE_URL=http://localhost:11434`
- `OLLAMA_EMBED_MODEL=bge-m3`
- `OLLAMA_CHAT_MODEL=qwen2.5:7b-instruct`
- `LLM_PROVIDER=ollama`

## 6) Ajustes no n8n
Substituir os nodes Gemini por HTTP Request:
- embeddings -> `POST {{OLLAMA_BASE_URL}}/api/embeddings`
- geracao -> `POST {{OLLAMA_BASE_URL}}/api/generate` ou `POST {{OLLAMA_BASE_URL}}/api/chat`

Boas praticas:
- manter `retryOnFail` com backoff;
- normalizar a resposta antes do callback;
- preservar o contrato `status: done` para a API.

## 7) Ajustes no seed do Pinecone
- Remover a dependencia do Gemini.
- Gerar embeddings via chamada HTTP ao Ollama usando `bge-m3`.
- Validar a dimensionalidade antes do upsert.
- Recriar o indice Pinecone com dimensao compativel ao embedding do `bge-m3` (validar antes do seed).
- Reexecutar o seed completo para alinhar o indice ao novo embedding.

## 8) Validacao de aceite
A implantacao so segue quando:
- `GET /api/tags` responde;
- embeddings geram vetor valido;
- geracao retorna JSON parseavel;
- seed do Pinecone conclui sem erro;
- workflow n8n completa `webhook -> embeddings -> pinecone -> rag -> callback`;
- relevancia permanece acima de 85% no holdout.

## 9) Rollback
Se algo falhar:
1. Reative o workflow Gemini como fallback.
2. Mantenha `LLM_PROVIDER=gemini` temporariamente.
3. Reabra o pacote de migracao para correcoes.

## 10) Ordem de execucao recomendada
1. Subir Ollama e baixar modelos.
2. Validar embeddings e geracao manualmente.
3. Atualizar variaveis de ambiente.
4. Migrar o workflow n8n.
5. Migrar o seed do Pinecone.
6. Rodar benchmark e comparar com Gemini.
7. Publicar o rollback/runbook final.
