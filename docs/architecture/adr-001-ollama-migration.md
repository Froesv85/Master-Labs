# ADR 001: Migração do Provedor de LLM de Gemini para Ollama

## Status
Aceito

## Contexto
O projeto MakerConnect inicialmente utilizava as APIs do Google Generative AI (Gemini) para gerar os embeddings vetoriais de componentes (upsert no Pinecone) e para a geração de conteúdo documental (Retrieval-Augmented Generation) ativada via webhook n8n.
Visando maior soberania de dados, redução de custos recorrentes de API e independência de conectividade externa para os fluxos centrais de extração, precisamos habilitar a execução de modelos Open Source hospedados locamente no mesmo ambiente do orquestrador.

## Decisão
Decidimos substituir a dependência nativa do Google Gemini por **Ollama**.
- **Orquestração:** o workflow do n8n foi refatorado para utilizar requisições nativas `http` chamando `/api/embeddings` e `/api/generate` (ou `/api/chat`) da infraestrutura do Ollama.
- **Modelos Padrão:** Padronizamos uso de embeddings em 768 dimensões (via `nomic-embed-text`) para alinhar estritamente com o índice atual do Pinecone, com `qwen2.5:7b-instruct` recomendado para geração.
- **Pinecone:** O script de popularização vetorial (`seed-pinecone.mjs`) foi adaptado para injetar os embeddings diretamente de Ollama.

## Consequências
**Positivas:**
- Execução isolada, mitigando riscos de bloqueios por rate limit das APIs na nuvem.
- Redução direta de custos de token limit para IA generativa em longos relatórios de projetos.
- Agilidade para trocar a versão do modelo rodando localmente de acordo com a necessidade (Ex: Llama 3 para Qwen).

**Negativas:**
- Maior consumo de recursos (CPU, RAM, e VRAM) no servidor ou máquina rodando Ollama+n8n.
- Necessidade de gerenciar a responsabilidade de manutenção da infra do proxy LLM (garantir downtime 0 da API localhost do Ollama).
