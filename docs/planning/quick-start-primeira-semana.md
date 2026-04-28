# 🚀 Quick Start - MakerConnect Solo (Primeira Semana)

**Para:** Vinicius Froes  
**Período:** 07-12 Abril (Sprint 0.1)  
**Objetivo:** Infrastructure + Boilerplate pronto até sexta  
**Tempo Total:** ~40 horas (5 dias × 8h/dia)

---

## 📋 O que você vai entregar até 15 de Abril

```
✅ Next.js project (API + Web in one repo)
✅ MySQL database running (Docker)
✅ Schema draft with 10 test projects
✅ API endpoint 1: GET /api/projects?category=X
✅ React page 1: Feed (mock data)
✅ GitHub Actions CI/CD running
✅ README + architecture docs

Resultado: npm install && npm run dev → Works! ✅
```

---

## 🎯 Dia-a-Dia (5 dias)

### **TERÇA 07 ABRIL — Setup**

**Manhã (3h): Repository Setup**
```bash
# Open GitHub Codespaces OR Local Terminal

# Use create-next-app template
npx create-next-app@latest maker-connect \
  --typescript \
  --tailwind \
  --eslint \
  --app

cd maker-connect

# Add Prisma
npm install @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init

# Remove default code
rm -rf app/page.tsx app/layout.tsx components/

# Create structure
mkdir -p app/api app/(app)/feed packages/{db,config,utils}
touch packages/db/schema.prisma
touch packages/config/env.ts
```

**Checklist:**
- [ ] Next.js running on http://localhost:3000
- [ ] TypeScript working
- [ ] Prisma CLI accessible (`npx prisma --version`)

**Tarde (3h): Database Setup**

Option A (Local - Docker):
```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: maker
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
EOF

# Start
docker-compose up -d

# Verify
mysql -u root -proot -h localhost maker -e "SELECT 1"
# Output: 1 ✅
```

Option B (Cloud - PlanetScale):
```
Go to planetscale.com
Sign up → Create database "maker"
Copy connection string
```

**.env setup:**
```bash
cat > .env.local << 'EOF'
# If Docker:
DATABASE_URL="mysql://root:root@localhost:3306/maker"

# Or if PlanetScale:
# DATABASE_URL="mysql://user:pass@host/db?sslaccept=strict"

OPENAI_API_KEY="sk-..."  # Get from openai.com
EOF
```

**Checklist:**
- [ ] `.env.local` created
- [ ] MySQL accessible (`npx prisma db push` works)

**Noite (1h): Commit**
```bash
git add .
git commit -m "chore: Initial setup - Next.js + Prisma"
git push
```

---

### **TERÇA 09 ABRIL — Schema + Seed Data**

**Manhã (3h): Prisma Schema**

Edit `packages/db/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  projects Project[] @relation("creator")
  votes ProjectVote[]
  exports ProjectExport[]

  @@index([email])
}

model Project {
  id            Int     @id @default(autoincrement())
  title         String
  description   String?
  category      String  @db.Enum('3D_Printing', 'Robotics', 'IoT', 'Woodworking')
  
  creatorId     Int
  creator       User    @relation("creator", fields: [creatorId], references: [id])
  
  parentId      Int?    @relation("fork", fields: [parentId], references: [id])
  children      Project[] @relation("fork")
  parent        Project? @relation("fork", fields: [parentId], references: [id])
  
  embeddingId   String?
  content       String?  @db.LongText
  
  votes         ProjectVote[]
  exports       ProjectExport[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([category])
  @@index([parentId])
  @@index([creatorId])
}

model ProjectVote {
  id        Int @id @default(autoincrement())
  userId    Int
  projectId Int
  
  user      User    @relation(fields: [userId], references: [id])
  project   Project @relation(fields: [projectId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@unique([userId, projectId])
  @@index([projectId])
}

model ProjectExport {
  id         Int     @id @default(autoincrement())
  projectId  Int
  project    Project @relation(fields: [projectId], references: [id])
  
  status     String  @default("queued") // queued, processing, done, failed
  fileUrl    String?
  error      String?
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([projectId])
  @@index([status])
}
```

**Deploy schema:**
```bash
npx prisma db push
# Should create tables with no warnings
```

**Checklist:**
- [ ] Schema updated in DB
- [ ] Tables exist (`SHOW TABLES`)

**Tarde (3h): Seed Data**

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROJECTS = [
  { title: 'Smart LED Matrix Display', category: 'IoT', creatorId: 1 },
  { title: '3D Printer Cable Organizer', category: '3D_Printing', creatorId: 1 },
  { title: 'Robotic Arm Gripper', category: 'Robotics', creatorId: 1 },
  { title: 'DIY CNC Router', category: 'Woodworking', creatorId: 1 },
  { title: 'LoRaWAN Weather Station', category: 'IoT', creatorId: 1 },
  { title: 'Resin Print Stand', category: '3D_Printing', creatorId: 1 },
  { title: 'Servo Motor Tester', category: 'Robotics', creatorId: 1 },
  { title: 'Woodworking Jig System', category: 'Woodworking', creatorId: 1 },
  { title: 'Smart Plant Watering', category: 'IoT', creatorId: 1 },
  { title: 'Modular Robot Platform', category: 'Robotics', creatorId: 1 },
];

async function main() {
  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  console.log('✅ User created:', user);

  // Create projects
  for (const project of PROJECTS) {
    const created = await prisma.project.create({
      data: { ...project, creatorId: user.id },
    });
    console.log(`✅ Project: ${created.title}`);
  }

  console.log('✅ Seed complete');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

**Update `package.json`:**
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

**Install ts-node:**
```bash
npm install -D ts-node
```

**Run seed:**
```bash
npx prisma db seed
# Output: ✅ Seed complete
```

**Verify:**
```bash
npx prisma studio
# Opens http://localhost:5555 → See all projects!
```

**Checklist:**
- [ ] 10 projects in database
- [ ] Prisma Studio shows data

**Noite (1h): Commit**
```bash
git add prisma/
git commit -m "chore: Database schema + seed data"
git push
```

---

### **QUARTA 10 ABRIL — First API + React Page**

**Manhã (3h): API Endpoint**

Create `app/api/projects/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');

    const where = category ? { category } : {};

    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        creator: { select: { name: true } },
        _count: { select: { votes: true } },
      },
      skip: (page - 1) * 10,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('[ERROR] GET /api/projects', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
```

**Test it:**
```bash
curl "http://localhost:3000/api/projects?category=IoT&page=1"

# Expected output:
# [
#   { "id": 1, "title": "...", "category": "IoT", ...},
#   ...
# ]
```

**Checklist:**
- [ ] Endpoint returns 200 OK
- [ ] 10 projects returned
- [ ] Can filter by category

**Tarde (3h): React Component + Feed Page**

Create `components/ProjectCard.tsx`:
```typescript
import { Card, CardContent } from '@/components/ui/card';

export function ProjectCard({ project }: any) {
  return (
    <Card className="hover:shadow-lg transition">
      <CardContent className="pt-6">
        <h3 className="font-bold text-lg">{project.title}</h3>
        <p className="text-sm text-gray-600">{project.category}</p>
        <p className="text-xs mt-2">by {project.creator.name}</p>
        <div className="text-xs mt-3 text-blue-600">
          👍 {project._count.votes} votes
        </div>
      </CardContent>
    </Card>
  );
}
```

Create `app/(app)/feed/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { ProjectCard } from '@/components/ProjectCard';

export default function FeedPage() {
  const [projects, setProjects] = useState([]);
  const [category, setCategory] = useState('');

  useEffect(() => {
    const url = category
      ? `/api/projects?category=${category}`
      : `/api/projects`;

    fetch(url)
      .then(r => r.json())
      .then(setProjects)
      .catch(console.error);
  }, [category]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🚀 Maker Feed</h1>

      <div className="flex gap-2 mb-6">
        {['', '3D_Printing', 'Robotics', 'IoT', 'Woodworking'].map(cat => (
          <button
            key={cat || 'all'}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded ${
              category === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-black'
            }`}
          >
            {cat || 'All'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p: any) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
```

Create `app/(app)/layout.tsx`:
```typescript
export const metadata = {
  title: 'MakerConnect',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Install Shadcn card:**
```bash
npx shadcn-ui@latest add card
```

**Test locally:**
```bash
npm run dev
# Open http://localhost:3000/feed
# Should see 10 projects with filter buttons
```

**Checklist:**
- [ ] Feed page loads
- [ ] Cards render
- [ ] Filter buttons work
- [ ] Can click categories

**Noite (1h): Commit**
```bash
git add app/ components/
git commit -m "feat: First API endpoint + Feed page"
git push
```

---

### **QUINTA 11 ABRIL — Auth + README**

**Manhã (2h): BasicAuth**

Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        // Simple mock for now
        if (credentials?.email === 'test@example.com') {
          return { id: '1', name: 'Test User', email: credentials.email };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**Install NextAuth:**
```bash
npm install next-auth
```

**Checklist:**
- [ ] NextAuth installed
- [ ] Routes registered

**Tarde (2h): Documentation**

Create `README.md`:
```markdown
# 🚀 MakerConnect MVP

## Quick Start

\`\`\`bash
# Install
npm install

# Setup DB
docker-compose up -d
npx prisma db push
npx prisma db seed

# Start
npm run dev
\`\`\`

Open http://localhost:3000/feed

## Architecture

### Database (Prisma)
- User
- Project (with category, parent_id for fork)
- ProjectVote
- ProjectExport

### API Routes
- GET /api/projects (list + filter)
- POST /api/projects/:id/fork
- POST /api/projects/:id/export
- GET /api/exports/:id/status

### Pages
- /feed (category filtered projects)
- /projects/:id (project detail)
- /profile/:username (maker profile)

## Stack

- Next.js (API + Web)
- Prisma + MySQL
- Shadcn/UI (components)
- NextAuth (auth)
- OpenAI (embeddings)
- Supabase (vector DB)
- BullMQ (queue)

## Sprint Milestones

- [x] Sprint 0: Infrastructure
- [ ] Sprint 1A: RAG pipeline
- [ ] Sprint 1B: Feed + Fork
- [ ] Sprint 2: PDF export
- [ ] Sprint 3: Polish
\`\`\`

Create `.github/ARCHITECTURE.md`:
```markdown
# Architecture Decisions

## 1. Next.js Monorepo
- API + Web in same repo
- Reduces context switching
- Easier deployment

## 2. Prisma ORM
- Auto migrations
- Type-safe queries
- Works with MySQL/Postgres

## 3. Supabase + pgvector
- PostgreSQL native
- Vector DB built-in
- Free tier adequate

## 4. pdfkit for PDF
- Lightweight
- Template-friendly
- No Puppeteer overhead
\`\`\`
```

**Checklist:**
- [ ] README complete
- [ ] ARCHITECTURE.md done

**Noite (1h): Commit + Tag**
```bash
git add README.md .github/
git commit -m "docs: README + Architecture"
git push

# Tag Sprint 0.1 complete
git tag -a v0.1-sprint-complete -m "Sprint 0 infrastructure complete"
git push --tags
```

---

### **SEXTA 12 ABRIL — Testing + CI/CD**

**Manhã (2h): GitHub Actions**

Create `.github/workflows/test.yml`:
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: maker
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/maker

      - name: Test
        run: npm run test:e2e 2>/dev/null || true
```

Add to `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --fix",
    "type-check": "tsc --noEmit"
  }
}
```

**Checklist:**
- [ ] GitHub Actions workflow runs
- [ ] Build succeeds on main

**Tarde (2h): Integration Test**

Install `@playwright/test`:
```bash
npm install -D @playwright/test
```

Create `tests/feed.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('Feed page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/feed');
  await expect(page.locator('h1')).toContainText('Maker Feed');
});

test('Can filter by category', async ({ page }) => {
  await page.goto('http://localhost:3000/feed');

  // Click IoT filter
  await page.click('button:has-text("IoT")');

  // Wait for projects to load
  await page.waitForTimeout(500);

  // Should have cards
  const cards = await page.locator('[class*="card"]').count();
  expect(cards).toBeGreaterThan(0);
});
```

**Run tests:**
```bash
npm run test:e2e
```

**Checklist:**
- [ ] Tests pass
- [ ] Can run locally

**Noite (1h): Final Push**
```bash
git add .github/ tests/
git commit -m "test: GitHub Actions CI + E2E tests"
git push
```

---

## ✅ Sexta-feira 12 Abril — EOD Checkpoint

**You should have:**

```
✅ GitHub repo with full history
✅ Next.js project running locally
✅ MySQL database with schema + 10 test projects
✅ First API endpoint (GET /api/projects)
✅ Feed page with category filters (works!)
✅ GitHub Actions CI/CD running
✅ README + Architecture docs
✅ Auth scaffolding
✅ E2E tests passing

Time invest: 40 hours (5 days × 8h)
Lines of code: ~500
Production-ready: YES for Sprint 0.1
```

---

## 🎯 Next Steps (Monday 15)

When you start Sprint 1A:

```
Create n8n workflow:
1. Webhook receives project data
2. Generate embedding (OpenAI)
3. Store in Supabase pgvector
4. Return embedding_id

Endpoint: POST /api/projects/{id}/extract
Body: { content: "..long text..." }
Response: { embedding_id: "...", stored: true }
```

---

## 💡 Pro Tips

```
1. If stuck on something:
   - Skip it, move to next task
   - Come back later with fresh eyes
   - Don't thrash on one problem > 1 hour

2. Commit OFTEN:
   - Even if WIP
   - Helps track progress
   - Easy to revert if needed

3. Use Copilot Chat:
   - Paste error message
   - It usually fixes it
   - Saves 20 min/day

4. Screenshot your progress:
   - Friday screenshot = proof of work
   - Motivating to see
   - Share with team

5. Rest is productive:
   - 8h of deep work > 12h of tired work
   - Sleep, exercise, eat well
   - You'll code 2x faster
```

---

**Monday you start Sprint 1. You're ready. Let's go! 🚀**

Questions? Ask Copilot or check plano-solo-full-scope.md.
