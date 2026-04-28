# Checklist Demo D5 e D10 - MakerConnect

## Contexto rapido
- Data base: 2026-04-17
- Fase social + exportacao PDF: concluida
- Migracao Ollama: concluida
- Proximo foco: validacao de metricas IA e hardening de demo

## Regras de aceite (globais)
- RAG relevancia >= 85% no conjunto de validacao definido
- Latencia ponta a ponta IA + callback + PDF < 15s (referencia de demo)
- Sem bug P0 aberto no fluxo principal em demonstracao
- Evidencias versionadas em docs (logs, snapshot, decisoes)

## D5 - Mid Demo (controle de risco)

### Escopo minimo demonstravel
- [ ] Fluxo completo: extract -> embeddings -> pinecone -> rag -> callback
- [ ] Painel de projeto mostra output tecnico (technicalRequirements + suggestedBOM)
- [ ] Exportacao PDF inicia e registra status (queued/processing/done/failed)

### Criterios de aceite D5
- [ ] 1 execucao E2E sem falha manual
- [ ] 1 execucao E2E com erro controlado (timeout ou parse) com log claro
- [ ] Logs de latencia por etapa salvos em documento de evidencia
- [ ] Evidencia de filtro PII antes da chamada externa registrada
- [ ] Lista de riscos D6-D9 atualizada com owner e ETA

### Evidencias obrigatorias D5
- [ ] Link para workflow n8n ativo/exportado
- [ ] Print ou log do callback retornando status done
- [ ] Snapshot de metricas parcial (p50, p95, taxa de parse JSON)
- [ ] Atualizacao de status no Jira para itens da sprint

### Gate D5 (Go/No-Go)
- [ ] GO: sem bloqueio tecnico critico para fechar D10
- [ ] NO-GO: existe P0 sem mitigacao definida

## D10 - Final Demo (fechamento)

### Escopo de fechamento
- [ ] Todas as historias P0 concluidas ou replanejadas formalmente
- [ ] Fluxo principal roda sem intervencao manual
- [ ] Demo reproduzivel em ambiente de apresentacao

### Criterios de aceite D10
- [ ] Relevancia RAG >= 85% (amostra e metodo descritos)
- [ ] Latencia total < 15s com valores p50 e p95 documentados
- [ ] Taxa de parse JSON valida >= 95%
- [ ] 0 bug P0 aberto no fluxo principal
- [ ] Historico de exportacao PDF auditavel por projeto
- [ ] Linha de governanca/fork rastreavel no projeto demonstrado

### Evidencias obrigatorias D10
- [ ] Relatorio final de metricas IA publicado em docs
- [ ] Ata da demo com decisoes e proximos passos
- [ ] Backlog da proxima sprint atualizado no Jira
- [ ] Lista de debitos tecnicos P1/P2 priorizada com owner

### Gate D10 (Go/No-Go)
- [ ] GO: criterios de aceite atendidos e demo aprovada
- [ ] NO-GO: KPI de qualidade ou latencia abaixo do minimo

## Quadro de acompanhamento rapido

### Donos
- [ ] Backend
- [ ] Frontend
- [ ] Produto
- [ ] AI-Orchestrator

### Top 3 riscos atuais
- [ ] Risco 1: Relevancia abaixo de 85% em alguns cenarios
- [ ] Risco 2: Variacao de latencia em horarios de pico local
- [ ] Risco 3: Falha eventual de parse JSON do modelo

## Registro de execucao (so marcar)

### D5
- [ ] Data executada:
- [ ] Status final: Green / Yellow / Red
- [ ] Responsavel:

### D10
- [ ] Data executada:
- [ ] Status final: Green / Yellow / Red
- [ ] Responsavel:
