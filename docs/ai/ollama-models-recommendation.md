# Sugestoes de modelos Ollama para MakerConnect

## Objetivo
Escolher modelos locais que atendam ao pipeline MakerBrain com foco em:
- embeddings confiaveis para Pinecone;
- geracao de JSON estruturado para RAG;
- boa cobertura em PT/EN;
- latencia aceitavel para demo e dev local.

## Recomendacao principal

### 1) Embeddings: `nomic-embed-text`
- Uso: embeddings gerais para busca vetorial.
- Vantagem: leve, popular e simples de operar localmente.
- Quando usar: primeira opcao para dev e demo.
- Comando:
```bash
ollama pull nomic-embed-text
```

### 2) Embeddings multilngues: `bge-m3`
- Uso: embeddings mais robustos para PT/EN e consulta semantica.
- Vantagem: melhor para conteudo misto e consultas tecnicas.
- Quando usar: se a base tiver muito conteudo em portugues e ingles.
- Comando:
```bash
ollama pull bge-m3
```

### 3) Geração principal: `qwen2.5:7b-instruct`
- Uso: gerar requisitos tecnicos, BOM e saida JSON estruturada.
- Vantagem: boa qualidade em instrucao + forte controle de formato.
- Quando usar: opcao principal para pipeline RAG local.
- Comando:
```bash
ollama pull qwen2.5:7b-instruct
```

### 4) Geração alternativa: `llama3.1:8b-instruct`
- Uso: geracao geral com boa estabilidade e ecossistema amplo.
- Vantagem: modelo equilibrado para teste e comparacao.
- Quando usar: fallback ou comparacao A/B com Qwen.
- Comando:
```bash
ollama pull llama3.1:8b
```

## Perfil recomendado por cenário

### Perfil A: maquina local modesta
- Embeddings: `nomic-embed-text`
- Geracao: `llama3.1:8b`
- Motivo: menor custo operacional e setup mais previsivel.

### Perfil B: melhor qualidade de saida JSON
- Embeddings: `bge-m3`
- Geracao: `qwen2.5:7b-instruct`
- Motivo: melhor para PT/EN, tarefas tecnicas e saida estruturada.

**Status no projeto:** este e o stack padrao escolhido para a migracao Gemini -> Ollama.

### Perfil C: comparacao e fallback
- Embeddings: `nomic-embed-text`
- Geracao: `llama3.1:8b`
- Motivo: baseline estavel para comparar com Gemini e facilitar rollback.

## Observacoes de arquitetura
- Para Pinecone, a dimensao do embedding precisa ser valida antes de gravar novos vetores.
- Se trocar o modelo de embedding, rode o seed novamente ou recrie o indice.
- Para saida JSON, mantenha prompt estrito e parse com fallback no workflow n8n.
- Se houver necessidade futura de extracao de imagem/esquematico, avaliar modelo multimodal separado como extensao da fase seguinte.

## Sugestao objetiva para o projeto
- Embedding padrao: `bge-m3`
- Embedding alternativo leve: `nomic-embed-text`
- Geracao padrao: `qwen2.5:7b-instruct`
- Fallback de geracao: `llama3.1:8b`

## Ordem de instalacao sugerida
1. `ollama pull bge-m3`
2. `ollama pull qwen2.5:7b-instruct`
3. `ollama pull llama3.1:8b-instruct`
4. `ollama pull nomic-embed-text` apenas se quiser um fallback mais leve para maquina fraca
