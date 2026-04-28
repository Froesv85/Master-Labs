# MakerConnect - Fala do Apresentador (12 Slides)

Data: 2026-04-18  
Duração total estimada: 5 a 6 minutos

## Orientação de uso
- Cada slide abaixo tem:
  - tempo sugerido de fala,
  - objetivo do slide,
  - script pronto (20-30s).
- Recomendação: manter ritmo constante e fechar com CTA para banca no último slide.

## Slide 1 - Problema e Oportunidade
Tempo sugerido: 25s  
Objetivo: abrir com dor real e tese do projeto.

Script:
"Em projetos maker IoT, a documentação técnica costuma ser incompleta, despadronizada e difícil de reaproveitar. Isso gera retrabalho e baixa reprodutibilidade. A oportunidade da MakerConnect é unir governança técnica com IA, para transformar conhecimento tácito em evidência estruturada, reutilizável e auditável."

## Slide 2 - Proposta MakerConnect
Tempo sugerido: 25s  
Objetivo: explicar solução em uma frase forte.

Script:
"A MakerConnect é uma plataforma de governança IoT com três pilares: camada social, camada de IA com RAG e camada documental com exportação PDF. Em vez de ser apenas um feed de projetos, ela organiza ciclo de vida técnico, rastreabilidade e geração automática de documentação."

## Slide 3 - Resultado Atual do Projeto
Tempo sugerido: 25s  
Objetivo: mostrar maturidade de entrega.

Script:
"Hoje já temos MVP funcional ponta a ponta: feed com filtros, fork com linhagem, upvote idempotente, log de dificuldades, extração IA com callback e exportação PDF assíncrona. Ou seja, a jornada principal do usuário já está operacional e validada tecnicamente."

## Slide 4 - C4 Contexto
Tempo sugerido: 25s  
Objetivo: situar sistema no ecossistema.

Script:
"No nível de contexto, a MakerConnect recebe interação do maker e da banca, e se integra a n8n, Ollama, Pinecone, MySQL e MinIO. Essa visão mostra fronteiras claras: aplicação no centro, orquestração IA ao lado e persistências especializadas por tipo de dado."

## Slide 5 - C4 Containers
Tempo sugerido: 30s  
Objetivo: explicar separação de responsabilidades.

Script:
"No nível de containers, temos Web App para experiência, API para regras de negócio, n8n para workflow de IA, Ollama para embeddings e geração, MySQL para dados transacionais, Pinecone para busca vetorial e MinIO para artefatos PDF. Essa divisão reduz acoplamento e facilita evolução por camadas."

## Slide 6 - C4 Componentes da API
Tempo sugerido: 25s  
Objetivo: evidenciar núcleo de domínio.

Script:
"Dentro da API, os componentes críticos são feed, fork, vote, difficulties, extract, callback, export e metrics. Aqui está a governança aplicada: linhagem por parentId, voto idempotente, trilha de dificuldades, estados assíncronos e observabilidade operacional para validar o comportamento do sistema."

## Slide 7 - C4 Componentes n8n/RAG
Tempo sugerido: 30s  
Objetivo: detalhar pipeline de IA.

Script:
"No workflow n8n, o processo segue webhook, preprocessamento, embeddings, retrieval vetorial, geração estruturada, validação e callback para API. É aqui que o RAG acontece na prática: a resposta da IA não vem isolada, ela é ancorada em contexto técnico recuperado da base vetorial."

## Slide 8 - Algoritmos e Regras
Tempo sugerido: 25s  
Objetivo: mostrar rigor técnico das decisões.

Script:
"Aplicamos algoritmos simples e efetivos para robustez: anonimização de PII por regex, extração de keywords por frequência com stopwords, ranking por votos no feed e regras de idempotência para evitar duplicidade. Isso traz previsibilidade operacional e melhora a qualidade dos dados do pipeline."

## Slide 9 - Bancos de Dados
Tempo sugerido: 25s  
Objetivo: justificar arquitetura de dados.

Script:
"Usamos persistência especializada: MySQL como fonte de verdade transacional, Pinecone para memória semântica no RAG e MinIO para objetos binários como PDFs. Essa separação é essencial: cada tecnologia atende um tipo de consulta e um tipo de responsabilidade no ciclo de governança."

## Slide 10 - Evidências Operacionais
Tempo sugerido: 30s  
Objetivo: comprovar funcionamento real.

Script:
"A operação é observável por estados queued, processing, done e failed, com logs de extração, métricas e histórico de exportações. Conseguimos validar estabilidade do fluxo assíncrono extract para n8n para callback, e manter evidência técnica que pode ser auditada em contexto acadêmico e de produto."

## Slide 11 - Riscos e Mitigações
Tempo sugerido: 30s  
Objetivo: mostrar maturidade de engenharia.

Script:
"O principal risco atual não é estabilidade, e sim qualidade de IA em KPI de latência e relevância. A mitigação já está no Jira: Epic ML-64 e blocker ML-65 para tuning de prompt, retrieval e runtime de modelo. Assim, o projeto evolui por backlog rastreável e metas objetivas."

## Slide 12 - Fechamento
Tempo sugerido: 25s  
Objetivo: concluir com valor e próximos passos.

Script:
"Concluindo: a MakerConnect já entrega governança técnica com trilha auditável e automação documental. Fechamos o gate de estabilidade e abrimos roadmap estruturado para otimização de IA. O valor central para a banca é claro: mais reprodutibilidade, mais rastreabilidade e menor esforço documental em projetos IoT."

## Resumo de tempo
- 12 slides x ~25s = ~5 minutos
- Com transições e pausa: 5:30 a 6:00

## Dicas rápidas de apresentação
- Slide 4, 5 e 7: falar apontando visualmente os blocos do diagrama.
- Slide 10: enfatizar estados assíncronos e evidência real.
- Slide 11: mostrar que risco já virou plano de execução, não pendência solta.
- Slide 12: fechar com frase de impacto e abrir para perguntas.
