# Atualizacao Jira e Kanban - 17/04/2026 (Epic S3-E1: Migração Ollama)

## Execucao aplicada em 17/04/2026

Migração do fluxo de IA Generativa de modelo corporativo em Cloud (Gemini) para ambiente totalmente open-source de execução local (Ollama) foi concluída e documentada, atualizando o roadmap do MVP de Governança IoT.

Todas as issues do pacote de migração tiveram seu status atualizado via CSV para `Done`:
- 5001 ([EPIC] S3-E1 Migracao Gemini para Ollama)
- 5002 ([STORY] S3-E1-H1 Pipeline MakerBrain com Ollama)
- 5003 ([TASK] S3-E1-H1-T1 Preparar ambiente Ollama e modelos)
- 5004 ([TASK] S3-E1-H1-T2 Migrar workflow n8n para Ollama)
- 5005 ([TASK] S3-E1-H1-T3 Refatorar seed vetorial para Ollama)
- 5006 ([STORY] S3-E1-H2 Validacao de qualidade e rollback)
- 5007 ([TASK] S3-E1-H2-T1 Rodar benchmark comparativo)
- 5008 ([TASK] S3-E1-H2-T2 Atualizar documentacao e rollback)

## Snapshot Kanban apos atualizacao

### Done
- Todo o pacote épico 5001 (Migração Gemini para Ollama).
- Workflow N8N migrado.
- Seeding do banco de vetores Pinecone validado e perfeitamente populado.

### In Progress
- Nenhum item de infraestrutura AI pendente.

### To Do
- Definir próxima frente com base nas metas do MVP da MakerConnect.

## Resumo Técnico (ADR 001)

1. **Geração via Ollama e bge-m3:** Todas as execuções dependentes do endpoint do Gemini foram cortadas para redução permanente de custos e aumento de estabilidade local. `nomic-embed-text` mantendo 768-D para evitar reconstrução forçada do Pinecone. `qwen2.5` ou `llama3.1` como recomendação de parser RAG JSON.
2. **Setup Automatizado do Pinecone:** Novo script de popularização vetorial (seeder) aponta diretamente para o Node Express do Ollama, garantido conectividade e integridade do knowledge base de hardwares e sensores IoT.
