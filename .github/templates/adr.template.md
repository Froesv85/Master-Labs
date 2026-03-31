# ADR-XXX — [Título da decisão]

- **Status:** [Proposta | Aprovada | Superseded]
- **Data:** [YYYY-MM-DD]
- **Decisores:** [Architect-FullStack, Backend-Platform, PM-Lead]
- **Relacionados:** [link para épico/story no Jira]

## Contexto
Descreva o problema técnico e o impacto no MVP Maker.

## Drivers de decisão
- [EX: reduzir tempo de entrega do PDF]
- [EX: manter escalabilidade inicial]
- [EX: simplificar operação em Sprint 1/2]

## Opções consideradas
1. **Opção A:** [nome]
   - Prós: [...]
   - Contras: [...]
2. **Opção B:** [nome]
   - Prós: [...]
   - Contras: [...]

## Decisão
Descreva a opção escolhida e o porquê.

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

## Rollback / Plano B
Descreva como reverter ou substituir a decisão sem parar o MVP.

---

## Exemplo de uso neste projeto
- Tema comum: `API + Worker + Web`.
- Tema comum: exportação PDF assíncrona (`queued`, `processing`, `done`, `failed`).
- Tema comum: upload por URL assinada e armazenamento S3-compatible.
