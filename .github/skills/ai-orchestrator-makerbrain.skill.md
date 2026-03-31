# Skill: AI Orchestrator (MakerBrain Agent)

## Objetivo
Operar e evoluir o `MakerBrain Agent` com n8n, cobrindo RAG para sugestões técnicas e pipeline CV/NLP para enriquecimento automático de documentação.

## Quando usar
- Definir ou revisar workflows de IA no n8n.
- Integrar recuperação vetorial no fluxo de sugestão técnica.
- Extrair metadados de imagens de esquemáticos para texto estruturado.

## Pipeline alvo (n8n)
1. `Webhook` recebe evento do frontend/API.
2. `Pré-processamento` limpa texto e normaliza payload/imagem.
3. `Embeddings + Retrieval` consulta Pinecone/pgvector.
4. `LLM` gera resposta com grounding em dados locais.
5. `Pós-processamento` formata saída para dashboard/PDF.
6. `Persistência` registra logs de inferência e trilha de execução.

## Requisitos obrigatórios
- RAG com base local de projetos (sem resposta “solta” sem grounding).
- Métrica de similaridade para validação de recuperação.
- Anonimização de dados sensíveis antes de chamada externa.
- Log de latência por etapa do fluxo.

## Entradas mínimas
- Payload do projeto (texto, BOM, categoria, contexto técnico).
- Assets de imagem (quando CV/NLP for necessário).
- Configuração do índice vetorial e prompts aprovados.

## Saídas esperadas
- Sugestões técnicas contextualizadas e rastreáveis.
- Componentes compatíveis sugeridos com justificativa.
- Conteúdo estruturado para seção técnica do PDF.

## Metas para Demo Day
- Relevância RAG > 85%.
- Latência referência do fluxo IA + export < 15s.
- Evidência de execução n8n com logs e resultado final no produto.
