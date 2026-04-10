# MakerConnect

Rede social técnica para governança de projetos IoT, com foco em rastreabilidade, reuso e documentação assistida por IA.

## Status atual

O repositório já saiu do estágio apenas conceitual e possui uma base funcional do MVP social.

### Já entregue
- Setup Next.js + Prisma + MySQL local.
- Schema e seed com dados de teste.
- Feed com filtros por categoria, busca, paginação e ordenação.
- Fluxo social com Ver, Fork, Upvote e Profile.
- Log de dificuldades com timeline e persistência por projeto.
- Navegação completa entre Feed -> Projeto -> Profile.

### Evolução recente
Na sprint atual, a base social ficou navegável de ponta a ponta:
- Feed com cards e filtros reais.
- Fork com lineage por `parentId`.
- Upvote idempotente com contador.
- Profile maker com total de votos e lista de projetos.
- Log de dificuldades para evidenciar bloqueios e aprendizados.

### Progresso estimado do MVP
- **60% concluído**
- Razão: a camada social principal já está pronta, mas a trilha IA/n8n, o PDF assíncrono e o fluxo LGPD ainda faltam para fechar o MVP completo.

## Como executar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para ver o feed.

## Próximos passos
- Fechar a trilha S1.1 com webhook de extração e pipeline IA.
- Consolidar exportação PDF assíncrona.
- Adicionar testes de integração para Feed, Fork, Vote e Profile.
