# MakerConnect

Rede social técnica para governança de projetos IoT, com foco em rastreabilidade, reuso e documentação assistida por IA.

Projeto de TCC — CATOLICASC, 7º Semestre (2026). Estudante: Vinicius Froes.

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Estilo | Tailwind CSS v4 |
| ORM | Prisma + MySQL |
| Fila assíncrona | BullMQ + Redis (ioredis) |
| IA / RAG | Google Gemini + Pinecone |
| Storage | AWS S3 |
| Runtime | Node.js ≥ 18 |

---

## Arquitetura

```
Browser
  └── Next.js App Router (app/)
        ├── (app)/feed          — Feed de projetos com filtros, vote, fork
        ├── (app)/robots        — Ranking de robôs + histórico de partidas
        ├── (app)/teams         — Equipes e membros
        ├── (app)/communities   — Comunidades por categoria
        ├── (app)/profile/[id]  — Perfil maker com badges e projetos
        └── api/
              ├── projects      — CRUD + vote + fork + extração IA + export PDF
              ├── robots        — CRUD + matches
              ├── teams         — CRUD + membros
              ├── communities   — CRUD + posts
              └── users/[id]    — Perfil + follow

Banco de dados: MySQL via Prisma
Fila: BullMQ + Redis (jobs de extração IA e export PDF)
IA: Gemini (extração) + Pinecone (embeddings RAG)
```

---

## Como executar

### Pré-requisitos

- Node.js ≥ 18
- MySQL rodando localmente
- Redis rodando localmente

### Setup

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com DATABASE_URL e REDIS_URL

# Aplicar migrations e seed
npx prisma migrate dev
npx prisma db seed

# Iniciar servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente obrigatórias

```env
DATABASE_URL="mysql://user:password@localhost:3306/makerconnect"
REDIS_URL="redis://localhost:6379"
```

---

## API Reference

### Projetos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/projects` | Lista projetos com filtros |
| POST | `/api/projects` | Cria projeto |
| POST | `/api/projects/[id]/vote` | Upvote idempotente |
| POST | `/api/projects/[id]/fork` | Fork com lineage |
| POST | `/api/projects/[id]/extract` | Dispara extração IA (async) |
| GET | `/api/projects/[id]/export` | Export PDF via fila BullMQ |

**Query params — GET /api/projects:**

| Param | Tipo | Valores | Padrão |
|-------|------|---------|--------|
| `category` | string | `3D_Printing`, `Robotics`, `IoT`, `Woodworking` | — |
| `q` | string | texto livre | — |
| `sort` | string | `newest`, `oldest`, `top` | `newest` |
| `page` | int | ≥ 1 | `1` |
| `pageSize` | int | 1–50 | `10` |

**Exemplo de resposta:**

```json
{
  "data": [{ "id": 1, "title": "RoboSumo v2", "category": "Robotics", "votes": 12, ... }],
  "pagination": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 },
  "filters": { "category": null, "q": null, "sort": "newest" }
}
```

### Robôs

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/robots` | Lista robôs ordenados por ELO |
| POST | `/api/robots` | Cadastra robô |
| GET/PATCH/DELETE | `/api/robots/[id]` | Detalhe, edição, remoção |

### Equipes & Comunidades

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/teams` | Lista / cria equipe |
| GET/POST | `/api/communities` | Lista / cria comunidade |

---

## Modelo de dados (resumo)

```
User ──< Project (creator)
              ├──< ProjectVote
              ├──< ProjectDifficulty
              ├──< ProjectExport (PDF async)
              └──< ProjectExtractionLog (IA pipeline)

Project ──< Project (fork via parentId)

User ──< Robot ──< RobotMatch
                └──< RobotAward

User >──< Team (via TeamMember)
User >──< Community (via CommunityMember)
Community ──< CommunityPost
```

---

## Features implementadas

- Feed de projetos com filtros por categoria, busca fulltext, paginação e ordenação
- Upvote idempotente com contador em tempo real
- Fork de projeto com rastreamento de lineage (`parentId`)
- Perfil maker com badges, nível (`apprentice` → `grandmaster`) e lista de projetos
- Log de dificuldades por projeto (timeline de bloqueios e aprendizados)
- Robôs: ranking ELO, histórico de partidas, premiações
- Equipes: criação, membros com roles (`owner`, `admin`, `member`)
- Comunidades estilo Orkut: posts, moderação, categorias
- Extração assíncrona via IA (Gemini + Pinecone) com callback de webhook
- Export PDF assíncrono via BullMQ

---

## Testes

```bash
npm test           # roda todos os testes
npm test -- --watch
npm test -- --coverage
```

Os testes unitários ficam em `__tests__/`.

---

## Progresso do MVP

| Módulo | Status |
|--------|--------|
| Feed social (projetos) | ✅ Completo |
| Robôs + ranking ELO | ✅ Completo |
| Equipes + comunidades | ✅ Completo |
| Perfil maker | ✅ Completo |
| Extração IA (async) | ✅ Completo |
| Export PDF (async) | ✅ Completo |
| Unit tests | ✅ Estrutura criada |
| LGPD / PII masking | 🔄 Em andamento |
| Deploy AWS | ⏳ Semana 10–12 |

**MVP: ~65% concluído.**

---

## Próximos passos (S1B)

- Aumentar cobertura de testes (target: >75%)
- ARCHITECTURE.md com diagrama C4
- LGPD compliance checklist
- Deploy em AWS (g4dn + RDS + ElastiCache)
