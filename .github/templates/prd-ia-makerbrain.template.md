# PRD IA — MakerBrain Agent (Template para Jira)

## Objetivo (IA)
Implementar um ecossistema de IA Generativa com RAG para governanca de projetos IoT, usando agentes orquestrados via n8n para reduzir documentacao fantasma e gerar saidas tecnicas auditaveis.

## Requisitos de IA (Obrigatórios)
| Requisito | Descrição técnica | Abordagem |
|---|---|---|
| Extracao | Parsing de texto/imagem de entradas maker e normalizacao de metadados tecnicos | CV/NLP + Webhook n8n |
| Pre-processamento | Embeddings + similaridade de cosseno + filtragem de PII | Pipeline funcional (pre-proc) |
| Modelo IA | Recuperacao vetorial com evidencias + geracao contextualizada de requisitos SW/HW | Transformer + RAG |
| Pos-processamento | Renderizacao de PDF tecnico e logs de validacao rastreaveis | Worker PDF + n8n |
| Etica e LGPD | Anonimizacao de dados sensiveis antes de chamadas externas | Responsabilidade etica |

## Indicadores de Sucesso (IA)
| Indicador | Meta |
|---|---|
| Relevancia RAG (holdout) | > 85% |
| Performance Pipeline | < 15s (referência de demo para fluxo IA + output) |
| Validacao de recuperacao | Similaridade de cosseno registrada por consulta |
| Reproducibilidade de forks | Tendencia de alta sprint a sprint |
| Reducao de esforco documental | Comparativo com/sem IA por tempo medio |

## Criterios de Validacao (Obrigatorios)
- Definir baseline com e sem pipeline IA para a mesma amostra de projetos.
- Medir cobertura documental de requisitos SW/HW nos dois cenarios.
- Registrar latencia ponta a ponta por estagio (extracao, pre-proc, modelo, pos-proc).
- Validar relevancia da recuperacao RAG com conjunto holdout.
- Comprovar anonimização de PII antes do processamento por LLM externa.
- Publicar evidencias de governanca: lineage de fork, historico de exportacao e logs de validacao.

## Arquitetura do Pipeline (Poster/Demo)
1. Frontend (React) envia upload de codigo/foto de circuito.
2. n8n recebe webhook.
3. Pré-processamento: limpeza de strings + normalização/redimensionamento de imagem.
4. Agente IA (GPT-4o/Llama 3 via n8n) executa RAG sobre base vetorial de componentes reais.
5. Pós-processamento formata saída e injeta no template de documentação.
6. Worker gera PDF e publica status no produto.

## Pipeline científico (evidência)
- Coleta: upload do usuário.
- Tratamento: normalizacao via n8n + anonimização de PII.
- Modelo: embeddings (`text-embedding-3-small` ou equivalente).
- Saida: dashboard + PDF exportado + trilha de validacao.

## Justificativa do modelo
Optar por modelos baseados em Transformers com técnica de RAG para reduzir alucinação técnica, restringindo sugestões a bases de hardware reais do ecossistema.

## Evidencias minimas esperadas
- Relatorio de qualidade RAG (amostra, metodo, resultado).
- Relatorio de latencia por etapa e latencia total.
- Registro de conformidade LGPD (PII detectada/removida).
- Exemplo de PDF tecnico auditavel gerado pelo pipeline.
