# Master-Labs

Blueprint do MVP de uma rede social voltada para cultura Maker e Engenharia, com foco em:
- portfólio técnico;
- repositório social de projetos (fork, BOM, logs de dificuldade, coautoria);
- geração assíncrona de documentação técnica em PDF.
- diferencial de IA com orquestração via n8n (`MakerBrain Agent`).

## Status atual

Este repositório está em fase de planejamento e organização de execução.

Já disponíveis:
- papéis de agentes e protocolo de trabalho;
- skills de planejamento, arquitetura e delivery;
- templates para Jira, ADR e checklists de demo.

## Escopo do MVP

- Feed de Inovações com filtros por categoria (`3D Printing`, `Robotics`, `IoT`, `Woodworking`)
- Perfil `Maker Professional` com `Hardware Stack` e medalhas
- Repositório social com `fork`, BOM interativa, log de dificuldades e coautoria
- Botão de exportação de documentação técnica em PDF
- Gamificação por `upvotes` e autoridade maker

## Nova diretriz de IA (Demo Day)

### MakerBrain Agent
Agente de IA orquestrado no n8n atuando em duas frentes:
- `RAG`: busca vetorial sobre base de projetos para sugerir soluções técnicas e componentes compatíveis.
- `Pipeline CV/NLP`: pré-processa imagens de esquemáticos e transforma saída em texto estruturado para documentação.

### Requisitos obrigatórios de IA
- Pipeline funcional no n8n (extração -> limpeza -> categorização -> saída para PDF/dashboard).
- Base vetorial para RAG (Pinecone ou Supabase pgvector).
- Ética/LGPD: anonimização de dados sensíveis antes de enviar para LLM externa.
- Métrica de validação: similaridade de cosseno na recuperação semântica.

### Indicadores de sucesso (IA)
- Relevância de sugestões RAG > 85%.
- Tempo total de processamento do fluxo IA + exportação < 15s (meta de referência para demo).
- Evidência de validação de recuperação vetorial por similaridade.

## Arquitetura de referência (planejada)

- `Web` + `API` + `n8n Orchestrator` + `Worker PDF`
- Backend sugerido: Node.js
- Banco de dados: PostgreSQL
- Jobs assíncronos: Redis + BullMQ
- Assets: storage S3-compatible
- IA generativa: OpenAI/Llama via n8n
- Vetor: Pinecone ou Supabase pgvector
- PDF Worker: Puppeteer

Fluxos críticos planejados:
- upload por URL assinada com envio direto ao storage;
- exportação de PDF assíncrona com status `queued`, `processing`, `done`, `failed`;
- webhook do frontend para n8n com pré/pós-processamento IA;
- enriquecimento da documentação automática com RAG + extração de imagem.

## Estrutura atual do repositório

- `.github/copilot-instructions.md`: guia operacional para agentes de código
- `AGENTS.md`: definição de papéis e protocolo entre agentes
- `.github/skills/`: skills de execução por especialidade
- `.github/templates/`: modelos prontos para Jira, ADR e demos D5/D10
- `.github/skills/ai-orchestrator-makerbrain.skill.md`: operação do pipeline IA no n8n
- `.github/templates/prd-ia-makerbrain.template.md`: campos de PRD IA para Jira/Poster

## Como usar este repositório agora

1. Ler `AGENTS.md` para entender responsabilidades.
2. Escolher a skill adequada em `.github/skills/` antes de propor solução.
3. Usar os templates em `.github/templates/` para padronizar planejamento e execução.
4. Evoluir para implementação mantendo decisões registradas por ADR.

## Próximos passos sugeridos

- Criar backlog no Jira via template CSV.
- Priorizar Sprint 0/1/2 com capacidade por squad.
- Iniciar scaffolding técnico da base `Web + API + n8n + Worker`.
- Publicar ADR de arquitetura para IA (orquestração, RAG, LGPD, métricas).
