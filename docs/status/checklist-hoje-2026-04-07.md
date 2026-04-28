# Checklist Executavel - Hoje (07/04/2026)

## Objetivo do dia
Entregar a base da Sprint S0.1 com setup funcional de projeto + banco local.

## Bloco 1 - Manha (Repository Setup)
- [x] Confirmar pre-requisitos locais (`node`, `npm`, `docker`, `git`)
- [x] Criar app Next.js (`maker-connect`) com TypeScript + Tailwind + ESLint + App Router
- [x] Instalar Prisma (`@prisma/client`, `prisma`)
- [x] Inicializar Prisma (`npx prisma init`)
- [x] Criar estrutura inicial de pastas
- [x] Validar app em dev (`npm run dev`)
- [x] Validar Prisma CLI (`npx prisma --version`)

## Bloco 2 - Tarde (Database Setup)
- [x] Criar `docker-compose.yml` com MySQL 8
- [x] Subir banco (`docker compose up -d`)
- [x] Criar `.env.local` com `DATABASE_URL`
- [x] Validar conexao (`npx prisma db push`)

## Bloco 3 - Noite (Fechamento)
- [ ] Revisar arquivos criados
- [x] Commit inicial (`chore: initial setup - next + prisma + mysql`)
- [ ] Push para remoto

## Criterios de pronto de hoje
- [x] Projeto inicia com `npm run dev`
- [x] Banco responde em `localhost:3307`
- [x] Prisma conecta e aplica schema sem erro
- [x] Mudancas versionadas no Git

## Log de execucao (preencher durante a execucao)
- [x] 09:00 Pre-check ambiente
- [x] 10:00 Scaffold Next.js concluido
- [x] 11:00 Prisma inicializado
- [x] 14:00 MySQL em pe
- [x] 15:00 `prisma db push` ok
- [ ] 17:00 Commit e push (commit feito, push pendente)

## Observacoes de execucao
- Prisma 7 exige URL de conexao no `prisma.config.ts` (schema sem `url` no datasource)
- Porta `3306` estava ocupada no host; ambiente do projeto ajustado para `3307`
- Repositorio local `maker-connect` sem remoto configurado no momento
