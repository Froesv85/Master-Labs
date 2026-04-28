# Plano de Migracao - Gemini para Ollama

## Objetivo
Substituir o uso de Gemini por Ollama no pipeline MakerBrain (embeddings + geracao RAG), mantendo compatibilidade com Pinecone, callback da API e exportacao PDF auditavel.

## Escopo
- Workflow n8n de extracao/RAG.
- Script de seed vetorial para Pinecone.
- Variaveis de ambiente e guias operacionais.
- Validacao de qualidade (relevancia) e desempenho (latencia).

## Fora de escopo
- Mudanca de banco vetorial (Pinecone permanece).
- Mudanca de schema de banco da aplicacao.
- Refatoracao ampla de UI.

## Estado atual (diagnostico)
- Workflow de referencia em [maker-connect/docs/n8n-workflow-v3-rag.json](maker-connect/docs/n8n-workflow-v3-rag.json) usa Gemini para embeddings e geracao.
- Script [maker-connect/scripts/seed-pinecone.mjs](maker-connect/scripts/seed-pinecone.mjs) usa Google Generative AI para embeddings.
- Existem artefatos antigos com OpenAI em [maker-connect/docs/n8n-workflow-export.json](maker-connect/docs/n8n-workflow-export.json), mas o fluxo estabilizado recente esta em v3.2 Gemini.

## Arquitetura alvo (Ollama)
- Embeddings: `bge-m3` como padrao do projeto.
- Geracao RAG: `qwen2.5:7b-instruct` como modelo padrao do projeto.
- Integracao n8n: HTTP Request para API do Ollama (`/api/embeddings` e `/api/generate` ou `/api/chat`).
- Pinecone: permanece para busca vetorial com dimensionalidade compativel ao modelo de embedding escolhido.

## Pre-condicoes
1. Ollama instalado no host de execucao do n8n.
2. Modelos baixados no ambiente alvo:
   - `ollama pull bge-m3`
   - `ollama pull qwen2.5:7b-instruct`
3. n8n com acesso de rede ao host do Ollama (localhost ou nome de servico Docker).
4. Definicao de dimensionalidade do embedding escolhida e aplicada de ponta a ponta.

## Plano por fases

### Fase 1 - Preparacao de ambiente
1. Definir modelos oficiais do projeto (1 de embedding + 1 de geracao).
2. Adicionar variaveis de ambiente:
   - `OLLAMA_BASE_URL` (ex.: `http://localhost:11434`)
   - `OLLAMA_EMBED_MODEL` (ex.: `bge-m3`)
   - `OLLAMA_CHAT_MODEL` (ex.: `qwen2.5:7b-instruct`)
3. Validar conectividade via curl:
   - `GET /api/tags`
   - `POST /api/embeddings`
   - `POST /api/generate`

Criterio de aceite:
- Ollama responde em < 2s para health/tags e retorna embedding/geracao com sucesso.

### Fase 2 - Migracao do workflow n8n
1. Duplicar workflow atual e criar versao `v3.3 (Ollama)`.
2. Substituir no n8n:
   - no "Gemini Embeddings" por HTTP Request para `{{ $env.OLLAMA_BASE_URL }}/api/embeddings`.
   - no "Gemini RAG" por HTTP Request para `{{ $env.OLLAMA_BASE_URL }}/api/generate` (ou `/api/chat`).
3. Ajustar mapeamentos no workflow:
   - vetor embedding no formato retornado pelo Ollama.
   - parser do texto de saida no "Prep Callback" (JSON estrito).
4. Manter retries com backoff para evitar falha em picos locais.

Criterio de aceite:
- Fluxo `webhook -> embeddings -> pinecone -> rag -> callback` executa fim a fim com `status: done`.

### Fase 3 - Migracao do seed vetorial
1. Refatorar [maker-connect/scripts/seed-pinecone.mjs](maker-connect/scripts/seed-pinecone.mjs):
   - remover dependencia `@google/generative-ai`.
   - gerar embeddings via chamada HTTP para Ollama.
2. Atualizar logs e mensagens para novo provedor.
3. Garantir que dimensao do vetor no Pinecone bate com o embedding escolhido.

Criterio de aceite:
- Seed completa sem erro e com upsert de todos os registros.

### Fase 4 - Compatibilidade e qualidade
1. Rodar bateria com conjunto fixo de prompts/projetos (minimo 20 casos).
2. Medir:
   - latencia total pipeline (p50/p95)
   - taxa de parse JSON valido
   - relevancia tecnica (meta > 85%)
3. Ajustar prompt/system e parametros do Ollama (`temperature`, `num_ctx`) para estabilidade.

Criterio de aceite:
- KPI minimo atendido: relevancia > 85% e latencia de referencia < 15s (ambiente demo).

### Fase 5 - Documentacao e rollout
1. Atualizar documentacao:
   - [maker-connect/docs/n8n-integration-guide.md](maker-connect/docs/n8n-integration-guide.md)
   - [README.md](README.md)
2. Registrar decisao tecnica (ADR curta) explicando troca Gemini -> Ollama.
3. Publicar checklist operacional de fallback.

Criterio de aceite:
- Time consegue subir ambiente e executar fluxo sem depender de Gemini.

## Plano de rollback
1. Manter workflow Gemini `v3.2` ativo como fallback durante validacao.
2. Deploy por feature flag de ambiente (`LLM_PROVIDER=gemini|ollama`).
3. Se KPI cair abaixo do limite por 2 rodadas consecutivas, reverter para Gemini e abrir acao corretiva.

## Stack escolhido para implantacao
- Embedding padrao: `bge-m3`
- Geracao padrao: `qwen2.5:7b-instruct`
- Fallback de geracao: `llama3.1:8b-instruct`
- Fallback de embedding opcional: `nomic-embed-text` caso seja necessario reduzir custo/tempo de resposta em maquina local fraca

## Riscos e mitigacoes
- Risco: dimensao de embedding diferente quebra query no Pinecone.
  - Mitigacao: fixar modelo e validar dimensao antes do seed.
- Risco: latencia local alta em hardware fraco.
  - Mitigacao: modelo menor para demo e pre-warm do Ollama.
- Risco: saida nao-JSON do modelo.
  - Mitigacao: prompt estrito + parser robusto + fallback de erro no callback.
- Risco: n8n em container sem acesso ao Ollama local.
  - Mitigacao: configurar rede Docker/host.docker.internal e testar conectividade antes do corte.

## Backlog sugerido (Jira)
1. Story: Migrar pipeline MakerBrain de Gemini para Ollama.
2. Sub-task: Preparar ambiente Ollama + modelos.
3. Sub-task: Migrar workflow n8n para endpoints Ollama.
4. Sub-task: Refatorar seed-pinecone para embeddings Ollama.
5. Sub-task: Executar benchmark de qualidade e latencia.
6. Sub-task: Atualizar docs + runbook de rollback.

## Definicao de pronto
- Nenhum uso de Gemini no caminho principal de execucao.
- Workflow n8n com Ollama ativo em ambiente de desenvolvimento.
- Seed vetorial funcionando com Ollama.
- KPI de relevancia e latencia dentro do target de demo.
- Documentacao e rollback publicados.
