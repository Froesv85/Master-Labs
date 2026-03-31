# PRD IA — MakerBrain Agent (Template para Jira)

## Objetivo (IA)
Implementar um ecossistema de Inteligência Artificial híbrido com NLP generativa + RAG para co-criação técnica e CV/NLP para extração de dados de esquemáticos. A orquestração deve ser feita via n8n em nuvem, com pipeline escalável e rastreável.

## Requisitos de IA (Obrigatórios)
| Requisito | Descrição técnica | Abordagem |
|---|---|---|
| Assistente RAG | Consulta base vetorial de projetos para sugerir melhorias e compatibilidade de componentes | Transformer + RAG |
| Pipeline de Dados | n8n: extração de metadados de imagens -> limpeza -> categorização via LLM | Pipeline funcional (extração/pré-proc) |
| Ética e LGPD | Anonimização de dados sensíveis antes de chamadas externas | Responsabilidade ética |

## Indicadores de Sucesso (IA)
| Indicador | Meta |
|---|---|
| Acurácia/Relevância RAG | > 85% |
| Performance Pipeline | < 15s (referência de demo para fluxo IA + output) |
| Validação de modelo | Similaridade de cosseno na recuperação vetorial |

## Arquitetura do Pipeline (Poster/Demo)
1. Frontend (`Next.js`) envia upload de código/foto de circuito.
2. n8n recebe webhook.
3. Pré-processamento: limpeza de strings + normalização/redimensionamento de imagem.
4. Agente IA (LangChain/OpenAI via n8n) executa RAG sobre base local.
5. Pós-processamento formata saída e injeta no template de documentação.
6. Worker gera PDF e publica status no produto.

## Pipeline científico (evidência)
- Coleta: upload do usuário.
- Tratamento: normalização via n8n.
- Modelo: embeddings (`text-embedding-3-small` ou equivalente).
- Saída: dashboard + PDF exportado.

## Justificativa do modelo
Optar por modelos baseados em Transformers com técnica de RAG para reduzir alucinação técnica, restringindo sugestões a bases de hardware reais do ecossistema.
