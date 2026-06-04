# ADR-XXX — [Título da decisão]

- **Status:** [Proposta | Aprovada | Superseded]
- **Data:** [YYYY-MM-DD]
- **Decisores:** [Architect-FullStack, Backend-Platform, PM-Lead]
- **Relacionados:** [link para épico/story no Jira]

## Contexto
Descreva o problema técnico e o impacto no MVP Maker.

Inclua, quando aplicavel, o impacto na governanca de projetos IoT, na qualidade do RAG e na latencia de documentacao.

## Drivers de decisão
- [EX: reduzir tempo de entrega do PDF]
- [EX: manter escalabilidade inicial]
- [EX: simplificar operação em Sprint 1/2]
- [EX: manter relevancia RAG > 85%]
- [EX: manter latencia IA + PDF < 15s para demo]
- [EX: garantir conformidade LGPD com anonimização de PII]

## Opções consideradas
1. **Opção A:** [nome]
   - Prós: [...]
   - Contras: [...]
2. **Opção B:** [nome]
   - Prós: [...]
   - Contras: [...]

## Decisão
Descreva a opção escolhida e o porquê.

Explique como a decisao preserva evidencias tecnicas (RAG com fontes reais) e rastreabilidade de governanca.

## Consequências
### Positivas
- [...]

### Negativas / Trade-offs
- [...]

## Plano de implementação
- [ ] Passo 1
- [ ] Passo 2
- [ ] Passo 3

## Critérios de aceite da decisão
- [ ] Critério técnico validável
- [ ] Critério de operação/monitoramento
- [ ] Critério de custo/tempo
- [ ] Critério de qualidade IA (relevancia/precisao de recuperacao)
- [ ] Critério de latencia ponta a ponta
- [ ] Critério de conformidade LGPD (PII anonimizada)
- [ ] Critério de rastreabilidade (logs + lineage + historico de exportacao)

## Rollback / Plano B
Descreva como reverter ou substituir a decisão sem parar o MVP.

---

## Exemplo de uso neste projeto
- Tema comum: `API + Worker + Web`.
- Tema comum: exportação PDF assíncrona (`queued`, `processing`, `done`, `failed`).
- Tema comum: upload por URL assinada e armazenamento S3-compatible.
- Tema comum: pipeline IA funcional (`extracao -> pre-proc -> modelo -> pos-proc`).
- Tema comum: validacao por baseline (com IA vs sem IA) e metricas de qualidade.
