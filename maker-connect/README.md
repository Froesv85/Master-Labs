# MakerConnect: guia do desenvolvedor

Rede social para makers com documentação técnica gerada por IA (lista de materiais, requisitos,
etapas de montagem e PDF). Projeto de TCC de Engenharia de Software (Católica SC, Jaraguá do Sul),
com patrocínio da Master by Tech. Em produção em **https://makerconnect.com.br**.

Este arquivo é para quem vai **rodar, mudar ou operar** o código. A visão geral e o relatório
acadêmico estão no [README da raiz](../README.md); o microsserviço de ML, em
[ml-pipeline/README.md](ml-pipeline/README.md).

---

## Stack

| Camada | Tecnologia |
|---|---|
| App (páginas + API) | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Banco | MySQL 8 via Prisma 6 |
| Filas e rate limiting | Redis + BullMQ (workers de extração e de PDF rodam dentro do processo do Next) |
| IA | Ollama (`qwen2.5:7b-instruct` para geração, `nomic-embed-text` para embeddings) + Pinecone (busca vetorial) |
| ML clássico | `ml-pipeline/`: FastAPI + scikit-learn (classificação, regras de BOM, auditoria) |
| Arquivos | MinIO (S3-compatível) |
| Auth | JWT em cookie `httpOnly` (`mc_session`, 7 dias) + OAuth Google/GitHub |
| PDF | jsPDF |
| Testes | Jest + ts-jest (app), Pytest (ml-pipeline) |
| Produção | VPS Hostinger com Docker Compose + nginx; deploy por GitHub Actions |

---

## Estrutura

```
maker-connect/
├── app/
│   ├── (app)/          # páginas autenticadas: projects, profile, teams, communities, robots, admin
│   ├── (auth)/         # login e cadastro (com aviso de aceite dos termos)
│   ├── api/            # rotas de API (auth, projects, users, teams, communities, robots, admin...)
│   ├── termos/ e privacidade/   # páginas legais públicas
│   └── page.tsx        # home pública (inclui a seção "Nossa história")
├── components/         # componentes compartilhados (logo, maker-history, legal-page...)
├── lib/                # auth, prisma, project-access, rate-limit, lgpd, ollama, pinecone,
│                       #   extraction-queue / pdf-export-queue (workers BullMQ), s3-service...
├── prisma/             # schema, migrations, seed.ts e seed-showcase-projects.cjs
├── ml-pipeline/        # microsserviço Python (estágios 1, 2 e 4 da Fase 5)
├── __tests__/          # testes Jest (rotas de API e middleware)
├── proxy.ts            # middleware de autenticação (o Next 16 chama de "proxy")
└── public/             # estáticos (historia/ é público; o resto exige sessão, ver Segurança)
```

`backend/` (Knex) é **código legado e não é usado** por nada; não confunda com `app/api/`.

---

## Rodando localmente

Pré-requisitos: Node 20+, Docker, e um Ollama acessível (local ou remoto) se você for testar a
extração por IA.

```bash
cp .env.example .env.local                 # e preencha JWT_SECRET (o resto já serve para local)
docker compose up -d mysql redis minio createbuckets ml-pipeline
npm install
npx prisma migrate dev                     # cria o schema no MySQL da porta 3307
npx prisma db seed                         # usuários e dados de demonstração (senha: maker123)
npm run dev                                # http://localhost:3000
```

Para virar admin: `npm run promote-admin -- seu-email@exemplo.com` (depois do primeiro login).

> **Windows com disco FAT32/exFAT:** o `next build` falha com `EISDIR: illegal operation on a
> directory, readlink`. Não é bug do código: faça o build a partir de um disco NTFS (com
> `npm ci` lá, não um junction para o `node_modules` do disco FAT). O CI, em Linux, não é afetado.

### Variáveis de ambiente

Todas estão comentadas em [`.env.example`](.env.example). As que mais causam confusão:

| Variável | Observação |
|---|---|
| `EXTRACTION_ENGINE` | `bullmq` em produção. **Sem a variável o código cai em `n8n`** (motor legado). |
| `OLLAMA_BASE_URL` | Host do Ollama. Sem ele, a extração por IA falha. |
| `S3_ENDPOINT` x `S3_INTERNAL_ENDPOINT` | O primeiro monta as URLs públicas; o segundo é o que o SDK usa. Em produção são diferentes (ver comentário em `lib/s3-service.ts`). |
| `REDIS_URL` | Usado pelas filas **e** pelo rate limiting. Sem Redis o limitador libera tudo (fail-open) e loga um aviso. |
| `PUBLIC_SITE_URL` | Base dos links impressos nos PDFs. |

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes Jest (`npm run test:coverage` para cobertura) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | checagem de tipos (o build **não** ignora mais erros de tipo) |
| `npm run build` / `npm start` | build e servidor de produção (`start` roda `prisma migrate deploy` antes) |

---

## Testes

```bash
npm test                                   # 359 testes, 45 suítes (rotas de API + middleware)
cd ml-pipeline && pytest                   # 30 testes do microsserviço Python
cd ml-pipeline && python -m eval.evaluate_category   # avaliação do classificador em português
```

Os testes de rota mockam `@/lib/prisma` e `@/lib/auth` (o `jose` é ESM e o Jest não o transforma).
Toda rota nova que mexe com dados de usuário deve ter teste de **401 sem sessão** e de
**403 para quem não é dono**, como em `__tests__/api/users-id.test.ts`.

---

## Segurança e autorização

**Duas camadas, sempre as duas:**

1. **`proxy.ts`** exige sessão em todas as páginas e em todo `/api/*`. Sem sessão, páginas
   redirecionam para `/login` e a API responde `401` em JSON. As exceções são explícitas:
   - páginas: `/`, `/login`, `/signup`, `/termos`, `/privacidade`, `/historia/*`;
   - API: `/api/auth/*`, `/api/health` e `/api/projects/[id]/extract/callback` (callback do n8n,
     autenticado pelo `webhookId`, que é um UUID e só o dono do projeto vê).
2. **Dentro de cada rota**, checar a permissão sobre o recurso. O middleware só garante que
   *existe* uma sessão, não que ela pode mexer naquele projeto. Use os helpers de
   `lib/project-access.ts`:
   - `requireOwnedProject(projectId, userId)` para escrita (só o dono);
   - `canAccessProject(project, userId)` e `projectVisibilityWhere(userId)` para leitura
     (respeita `public`, `private_owner` e `private_team`).

Outras regras do código:

- Ao devolver usuários, use **`select` explícito**. Nunca `include`/linha inteira de `User`
  (tem `password`, `googleId`, `githubId`, `role`). O e-mail só vai para o próprio usuário.
- O usuário vem **sempre da sessão** (`getSession()`), nunca de `userId` no corpo da requisição.
- **Rate limiting** (`lib/rate-limit.ts`, Redis, janela fixa):

  | Ação | Limite |
  |---|---|
  | login | 20 por IP e 5 por e-mail a cada 15 min |
  | cadastro | 5 por IP por hora |
  | extração por IA | 10 por usuário por hora |
  | geração de PDF | 20 por usuário por hora |

  O IP vem do `X-Real-IP`, que o nginx sobrescreve (o `X-Forwarded-For` pode ser forjado).
- **LGPD:** `lib/lgpd.ts` remove e-mail, telefone e CPF do texto antes de qualquer chamada de IA,
  e `lib/lgpd-audit.ts` registra cada remoção.
- Senhas com bcrypt; mínimo de 8 caracteres no cadastro.

---

## Deploy

Todo push na `main` dispara [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):

1. `build` e `build-ml` constroem e publicam as imagens `ghcr.io/froesv85/maker-connect` e
   `maker-connect-ml` (tags `latest` e SHA curto);
2. `deploy` entra por SSH no VPS, faz `git pull`, `docker compose pull` e `up -d` dos dois
   serviços e **reinicia o nginx** (sem isso ele fica preso no IP antigo do container e tudo vira 502).

Problemas já vistos:

- **Merges seguidos** disparam deploys simultâneos que disputam o container `maker-ml-pipeline`
  (`removal of container ... is already in progress`). O último vence; os outros falham.
- **Timeout de SSH** (`dial tcp ***:22: i/o timeout`) do runner do GitHub: rode de novo só o job
  que falhou (`gh run rerun <id> --failed`); as imagens já construídas são reaproveitadas.

As migrations rodam sozinhas na subida do container (`prisma migrate deploy` no `CMD`).

---

## Operação em produção

```bash
ssh -i ~/.ssh/makerconnect_hostinger root@2.25.146.28   # pelo IP: o hostname não está no known_hosts
docker ps                                               # maker-connect, maker-ml-pipeline, maker-mysql,
                                                        # maker-redis, maker-minio, maker-nginx
docker logs -f maker-connect                            # logs do app
docker exec -it maker-mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" maker'
```

O MySQL **não** fica exposto fora do VPS. Para um cliente gráfico, abra um túnel SSH até o IP
interno do container (`docker inspect maker-mysql`).

**Projetos de demonstração:** `prisma/seed-showcase-projects.cjs` cadastra 8 projetos completos
(BOM, dificuldades, código e dossiê) para um usuário existente. É idempotente e tem `DRY_RUN=1`:

```bash
docker exec -e OWNER_EMAIL=voce@exemplo.com -e DRY_RUN=1 maker-connect node prisma/seed-showcase-projects.cjs
```

---

## Páginas legais

`/termos` e `/privacidade` (`app/termos`, `app/privacidade`, layout em `components/legal-page.tsx`)
descrevem o que o código faz de fato. **Se você mudar a coleta de dados, os cookies, os
fornecedores (Pinecone, Hostinger, OAuth) ou a forma de usar IA, atualize a Política de
Privacidade e a data `LEGAL_UPDATED_AT`.** Contato: `privacidade@makerconnect.com.br`.

---

## Dívida técnica conhecida

Em ordem de prioridade:

- **CI sem testes:** o workflow constrói e publica sem rodar `npm test`, lint nem `tsc`.
- **Prisma 6 → 7:** as 3 vulnerabilidades altas restantes do `npm audit` exigem a migração.
- **Backup:** não há rotina versionada; banco e arquivos do MinIO estão no mesmo disco do VPS.
- **Sessão sem revogação:** o JWT vale 7 dias; logout e troca de senha não derrubam sessões abertas.
- **Sem e-mail transacional:** não há recuperação de senha nem confirmação de e-mail.
- **LGPD operacional:** falta autoexclusão de conta, registro do aceite dos termos (data e versão)
  e consentimento dos pais no cadastro de menores.
- **Observabilidade:** só `console.*`; sem rastreamento de erros nem alerta de queda.
- **Sem staging:** mudanças vão direto para produção.
- **Validação de entrada manual:** adotar Zod nas rotas.
- **Headers de segurança** (CSP, HSTS, X-Frame-Options) ausentes no Next e no nginx.
- **Estáticos de `public/`** fora de `/historia/` exigem sessão (o `proxy.ts` não distingue arquivo de página).
- **Lint:** 2 erros antigos de `react-hooks/set-state-in-effect` em `profile/page.tsx` e `teams/[id]/page.tsx`.
- **Código e dependências mortas:** `backend/`, `pdfkit`, `pdfmake`, `pdf-lib`, `@google/generative-ai`.

---

## Modelo de dados

São 31 modelos em [`prisma/schema.prisma`](prisma/schema.prisma). O núcleo:

```
User ──< Project (creator) ──< ProjectComponent, ProjectImage, ProjectFile, ProjectCodeFile,
   │          │                ProjectDifficulty, ProjectComment, ProjectVote, ProjectShare,
   │          │                ProjectExport (PDF), ProjectExtractionLog (IA), LgpdAuditLog
   │          ├──1 ProjectDossier (resultado da IA editável pelo dono)
   │          └──< Project (fork, via parentId)
   ├──1 UserProfile, ──< UserBadge, UserFollow
   ├──< Robot ──< RobotMatch, RobotAward, RobotEventParticipation
   ├──< TeamMember >── Team ──< Competition
   └──< CommunityMember >── Community ──< CommunityPost
```
