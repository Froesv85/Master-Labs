# Master-Labs

MakerConnect: Rede social técnica para governança de projetos IoT com documentação automatizada via agentes de IA e n8n.

MakerConnect: A technical social network for IoT project governance with automated documentation via AI agents and n8n.

## Resumo da Proposta

Este trabalho apresenta a MakerConnect, uma rede social para cultura Maker e IoT que integra um pipeline funcional de IA Generativa orquestrado por n8n.

A plataforma aplica RAG (Retrieval-Augmented Generation) com agentes baseados em GPT-4o para extrair requisitos de entradas nao estruturadas e gerar documentacao tecnica em PDF automaticamente.

A base vetorial (Pinecone/Supabase) usa dados reais de componentes eletronicos para reduzir alucinacoes tecnicas.

Mecanismos sociais como fork, upvotes e log de dificuldades ampliam reprodutibilidade e rastreabilidade. A conformidade com LGPD e tratada com anonimização de PII antes do processamento por IA.

## Status atual

Este repositorio avancou da base social para um MVP funcional com trilha IA e fechamento da Fase 6 (Exportacao PDF) no Jira/Kanban em 14/04/2026.

Ja disponiveis:
- setup Next.js + Prisma + MySQL local;
- feed filtravel com busca, paginacao e ordenacao;
- fluxo social com ver, fork, upvote e profile maker;
- log de dificuldades por projeto com timeline;
- pipeline n8n para extracao e geracao RAG configurado com Ollama (bge-m3 e qwen2.5:7b) e callback para API;
- exportacao PDF assincrona com historico e rastreabilidade;
- armazenamento S3-compatible via MinIO para artefatos de exportacao;
- documentos operacionais para Jira, Kanban e evolucao diaria.

### Evolucao recente

Em 07/04, a base social ficou navegavel de ponta a ponta:
- Feed -> Projeto -> Profile conectado;
- fork com lineage por `parentId`;
- upvote idempotente com contador;
- profile maker com total de votos e lista de projetos;
- log de dificuldades persistido no banco e exibido na pagina do projeto.

### Progresso estimado do projeto

- Progresso atual do MVP: **85%**
- Justificativa: pilares sociais, pipeline IA base e exportacao PDF assincrona ja foram entregues; restam consolidacao de metricas e hardening para demo final.
- Leitura pratica: o produto ja fecha o fluxo principal de automacao tecnica e entrou em fase de estabilizacao/validacao.

## Problema e Hipotese

Problema de pesquisa: como agentes de IA Generativa orquestrados via n8n podem reduzir a lacuna de documentacao em comunidades maker, promovendo reprodutibilidade e rastreabilidade em projetos IoT?

Hipotese: integrar pipeline RAG em uma rede social maker reduz tempo e esforco cognitivo de documentacao tecnica, aumentando padronizacao e reuso de hardware.

## Objetivos

Objetivo geral:
- Desenvolver a MakerConnect integrando IA Generativa e orquestracao n8n para automatizar documentacao tecnica e gerenciar ciclo de vida de projetos IoT.

Objetivos especificos:
- Implementar pipeline funcional com Extracao, RAG e Pos-processamento.
- Orquestrar workflows via n8n em nuvem.
- Construir base vetorial com dados reais de componentes eletronicos.
- Modelar estrutura social com forks, upvotes, BOM e logs.
- Garantir conformidade LGPD com anonimização de PII.
- Validar reducao do esforco documental por metricas comparativas.

## Escopo do MVP

- Feed de Inovacoes com filtros por categoria (`3D Printing`, `Robotics`, `IoT`, `Woodworking`)
- Perfil `Maker Professional` com `Hardware Stack` e medalhas
- Repositorio social com `fork`, BOM interativa, log de dificuldades e coautoria
- Exportacao assincrona de documentacao tecnica em PDF
- Gamificacao por `upvotes` e autoridade maker

## Pipeline Funcional de IA (Obrigatorio)

### MakerBrain Agent
Agente de IA orquestrado no n8n atuando em duas frentes:
- `RAG`: recuperacao vetorial com base em evidencias para gerar requisitos SW/HW estruturados.
- `Pipeline CV/NLP`: extracao de entradas nao estruturadas (texto/imagem) para documentacao tecnica auditavel.

### Estagios obrigatorios
- Extracao: upload via interface web + parsing NLP de descricoes e imagens.
- Pre-processamento: embeddings, similaridade de cosseno e filtragem de PII (LGPD).
- Modelo IA: RAG com recuperacao vetorial e geracao contextualizada (Ollama local - Qwen2.5 / Llama 3.1).
- Pos-processamento: renderizacao PDF, metricas de cobertura documental e logs de validacao.

### Indicadores de sucesso (IA)
- Relevancia de sugestoes RAG > 85%.
- Tempo total de processamento IA + exportacao < 15s (meta de referencia para demo).
- Evidencia de validacao de recuperacao vetorial por similaridade.
- Reducao mensuravel do tempo de documentacao tecnica.

## Arquitetura de referencia (planejada)

- `Web (React)` + `API (Node.js)` + `n8n Orchestrator` + `Worker PDF`
- Banco social: MySQL
- Jobs assincronos: Redis + BullMQ
- Assets: storage S3-compatible
- LLMs: Ollama Local (qwen2.5:7b, llama3.1:8b) + Embeddings (bge-m3 / nomic)
- Vetor: Pinecone ou Supabase pgvector
- PDF Worker: Puppeteer

Fluxos criticos planejados:
- upload por URL assinada com envio direto ao storage;
- exportacao de PDF assincrona com status `queued`, `processing`, `done`, `failed`;
- webhook do frontend para n8n com pre/pos-processamento IA;
- enriquecimento da documentacao automatica com RAG + extracao de imagem;
- anonimização de PII antes de qualquer chamada para LLM externa.

## Estrutura atual do repositorio

- `.github/copilot-instructions.md`: guia operacional para agentes de codigo
- `AGENTS.md`: definicao de papeis e protocolo entre agentes
- `.github/skills/`: skills de execucao por especialidade
- `.github/templates/`: modelos para Jira, ADR e demos D5/D10
- `.github/skills/ai-orchestrator-makerbrain.skill.md`: operacao do pipeline IA no n8n
- `.github/templates/prd-ia-makerbrain.template.md`: campos de PRD IA para Jira/Poster

## Qualidade, Etica e LGPD

- Anonimizar PII antes do processamento por IA.
- Exigir consentimento explicito para compartilhamento de projetos.
- Garantir criptografia em transito e em repouso.
- Medir cobertura documental, tempo medio de geracao e indice de reprodutibilidade.

## Como usar este repositorio agora

1. Ler `AGENTS.md` para entender responsabilidades.
2. Escolher a skill adequada em `.github/skills/` antes de propor solucao.
3. Usar templates em `.github/templates/` para padronizar planejamento e execucao.
4. Evoluir para implementacao mantendo decisoes registradas por ADR.

## Proximos passos sugeridos

- Criar backlog no Jira via template CSV.
- Priorizar Sprint 0/1/2 com capacidade por squad.
- Iniciar scaffolding tecnico da base `Web + API + n8n + Worker`.
- Publicar ADR de arquitetura para IA (orquestracao, RAG, LGPD, metricas).
