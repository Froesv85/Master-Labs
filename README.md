# Master-Labs

Blueprint do MVP de uma rede social voltada para cultura Maker e Engenharia, com foco em:
- portfólio técnico;
- repositório social de projetos (fork, BOM, logs de dificuldade, coautoria);
- geração assíncrona de documentação técnica em PDF.

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

## Arquitetura de referência (planejada)

- `API` + `Worker` + `Web`
- Backend sugerido: Node.js
- Banco de dados: PostgreSQL
- Jobs assíncronos: Redis + BullMQ
- Assets: storage S3-compatible
- PDF Worker: Puppeteer

Fluxos críticos planejados:
- upload por URL assinada com envio direto ao storage;
- exportação de PDF assíncrona com status `queued`, `processing`, `done`, `failed`.

## Estrutura atual do repositório

- `.github/copilot-instructions.md`: guia operacional para agentes de código
- `AGENTS.md`: definição de papéis e protocolo entre agentes
- `.github/skills/`: skills de execução por especialidade
- `.github/templates/`: modelos prontos para Jira, ADR e demos D5/D10

## Como usar este repositório agora

1. Ler `AGENTS.md` para entender responsabilidades.
2. Escolher a skill adequada em `.github/skills/` antes de propor solução.
3. Usar os templates em `.github/templates/` para padronizar planejamento e execução.
4. Evoluir para implementação mantendo decisões registradas por ADR.

## Próximos passos sugeridos

- Criar backlog no Jira via template CSV.
- Priorizar Sprint 0/1/2 com capacidade por squad.
- Iniciar scaffolding técnico da base `API + Worker + Web`.
