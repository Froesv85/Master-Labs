# ⚡ Guia Tático de Execução - Solo Developer Speedrun

**Para:** Vinicius Froes  
**Objetivo:** Máxima produtividade com mínimo desgaste  
**Período:** 12 semanas (04 abril - 01 julho)

---

## 🕐 Rotina Diária Otimizada

### **Morning (09:00-12:00) — Deep Work Block 1**
```
09:00-09:10   ☀️ Quick standup (write in Jira sprint board)
               - What I did yesterday
               - What I'm doing today
               - Any blockers?

09:10-11:50   💻 DEEP WORK (no Slack, no email, no context switch)
               Focus on the hardest architectural task first
               Your brain is freshest now

11:50-12:00   📝 Checkpoint (save progress, commit to git)
```

### **Lunch (12:00-13:00)**
```
Take REAL lunch break (30min away from desk)
Then: Admin tasks (emails, PR reviews, Jira updates) 13:00-13:30
```

### **Afternoon (13:30-17:00) — Deep Work Block 2**
```
13:30-13:40   🔄 Context resume (read your notes from morning)

13:40-16:30   💻 DEEP WORK (continuation of morning)
               Implement, test, debug

16:30-16:50   🧪 Testing + commit
               - Does it work?
               - Any regressions?
               - Push to GitHub

16:50-17:00   📌 EOD checkpoint (update Jira, tomorrow prep)
```

### **Evening (17:00+)**
```
❌ DONT code
✅ DO: Walk, gym, dinner, relax

You're more productive tomorrow after rest than
burning out tonight.
```

**Daily Capacity:** ~7 productive hours = ~1.4 SP/day

---

## 🛠️ Tech Stack Selection (Speed Over Learning)

### **Backend: Next.js (Full-Stack)**
```
WHY:
✅ API + Web in ONE project (no context switch between repos)
✅ Built-in middleware, auth, database
✅ TypeScript optional but recommended
✅ Vercel deployment one-click

ALTERNATIVE: Express + React (adds context switching)

Setup time: 30 min (with template)
Learning curve: 2/10 (if you know Node + React)
```

### **Database: PlanetScale (MySQL Serverless)**
```
WHY:
✅ MySQL (familiar SQL)
✅ Serverless (no ops, auto-scaling)
✅ Prisma ORM (auto migrations)
✅ Free tier for MVP

Setup time: 15 min
Learning curve: 1/10
```

### **Vector DB: Supabase (PostgreSQL + pgvector)**
```
WHY:
✅ PostgreSQL built-in (familiar SQL)
✅ pgvector extension for AI/embeddings
✅ REST API included
✅ Free tier covers MVP

Setup time: 20 min
Learning curve: 2/10

ALTERNATIVE: Pinecone (simpler but vendor lock-in)
```

### **Embeddings: OpenAI API**
```
WHY:
✅ State-of-art (text-embedding-3-small)
✅ Simple HTTP calls
✅ ~$0.02 per 1M tokens (cheap)

Setup time: 5 min (API key)
Learning curve: 1/10

ALTERNATIVE: HuggingFace local (slower, no vendor cost)
```

### **Queue: BullMQ (Redis-based)**
```
WHY:
✅ Same Node code (no new language)
✅ Simple job queue pattern
✅ Runs in same process or separate worker

Setup time: 10 min
Learning curve: 3/10
```

### **PDF: pdfkit (Node.js)**
```
WHY:
✅ Lightweight (no Puppeteer heavyweight)
✅ Template-based (no complex rendering)
✅ ~80% of Puppeteer functionality

Setup time: 15 min
Learning curve: 3/10

AVOID: Puppeteer (overkill, slow, 100x complexity)
```

### **Frontend: Next.js + Shadcn/UI**
```
WHY:
✅ React components (pre-built design system)
✅ Dark mode + theming out-of-box
✅ Accessible + responsive

Setup time: 20 min
Learning curve: 2/10 (copy-paste components)
```

### **Monitoring: Vercel + Sentry**
```
WHY:
✅ Vercel built-in analytics
✅ Sentry error tracking (free tier)
✅ Logs via console (stdout → Vercel)

Setup time: 10 min
Learning curve: 1/10
```

### **Auth: NextAuth.js**
```
WHY:
✅ Built-in to Next.js ecosystem
✅ JWT + session handling
✅ Simple OAuth if needed

Setup time: 30 min
Learning curve: 4/10 (most complex setup, do early)
```

**Total Setup Time:** ~2 hours  
**Total Learning Curve:** 2.5/10 average  
**Time to first endpoint:** ~3 hours

---

## 💾 Repository Structure (Maximize Clarity)

```
/maker-connect
├── /apps
│   ├── /web (Next.js app router)
│   │   ├── /app (pages + API routes)
│   │   │   ├── /api
│   │   │   │   ├── projects/route.ts
│   │   │   │   ├── projects/[id]/extract/route.ts
│   │   │   │   ├── projects/[id]/fork/route.ts
│   │   │   │   ├── exports/[id]/route.ts
│   │   │   │   └── exports/history/route.ts
│   │   │   └── /(app)
│   │   │       ├── feed/page.tsx
│   │   │       ├── projects/[id]/page.tsx
│   │   │       ├── profile/[username]/page.tsx
│   │   │       └── exports/page.tsx
│   │   └── /components
│   │       ├── feed/
│   │       ├── project/
│   │       └── shared/
│   └── /worker (Bull queue worker)
│       ├── jobs/
│       │   ├── generatePdf.ts
│       │   └── evaluateRag.ts
│       └── index.ts
├── /packages
│   ├── /db (Prisma models)
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── /config (shared constants)
│   │   ├── categories.ts
│   │   ├── api.ts
│   │   └── env.ts
│   └── /utils (shared functions)
│       ├── embeddings.ts
│       ├── pdf.ts
│       └── validation.ts
├── docker-compose.yml (MySQL + Redis)
├── .github/workflows/ (CI/CD)
├──

.env.example
└── README.md
```

**Clarity rule:** If you can't find a file in <5 seconds, restructure.

---

## 📦 Boilerplate Templates (Copy-Paste to Win)

### **1. API Endpoint Template**

```typescript
// /app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');
    const page = req.nextUrl.searchParams.get('page') || '1';

    // Query DB
    const projects = await prisma.project.findMany({
      where: { category },
      skip: (parseInt(page) - 1) * 10,
      take: 10,
      select: { id: true, title: true, category: true },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**Copy-paste into each endpoint. Time saved: ~1 hour per endpoint.**

### **2. React Component Template**

```typescript
// /components/feed/ProjectCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProjectCardProps {
  project: { id: string; title: string; category: string };
  onFork: (id: string) => void;
}

export function ProjectCard({ project, onFork }: ProjectCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{project.category}</p>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => onFork(project.id)}>Fork</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Copy-paste into each component. Time saved: ~2 hours UI development.**

### **3. Database Query Template**

```typescript
// /packages/utils/projects.ts
import { prisma } from '@/db';

const projectSelect = {
  id: true,
  title: true,
  category: true,
  embeddingId: true,
  parentId: true,
  createdAt: true,
  votes: true,
};

export async function getProjectsByCategory(category: string, page: number) {
  return prisma.project.findMany({
    where: { category },
    select: projectSelect,
    skip: (page - 1) * 10,
    take: 10,
  });
}
```

**Define ONCE, use in 5+ places. Time saved: ~30 min consistency.**

### **4. CI/CD GitHub Actions**

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/deploy-pages@v3
```

**Set once, runs automatically. Time saved: ~2 hours manual testing.**

---

## ⚡ Productivity Hacks (Stolen from FAANG)

### **Hack 1: Avoid Local Setup with GitHub Codespaces**
```
Instead of:
- Struggling with Node version
- MySQL on local machine
- Docker desktop issues

Use:
$ Open in GitHub Codespaces (one-click on GitHub)
Instant: Ubuntu + Docker + Node + DB
Browser IDE

Time saved: 2-3 hours debugging environment issues
```

### **Hack 2: Use .cursorrules for Copilot Context**
```
Create /.cursorrules file:

Your task: MakerConnect MVP
Stack: Next.js, Prisma, Shadcn/UI, OpenAI, Bull
Requirements:
- API fast (<100ms per call)
- PDF generation <5min per export
- RAG evaluation nightly
- LGPD compliant (PII masking)

When I ask you to code:
1. Use the project structure above
2. Copy templates not reinvent
3. Import from /packages/utils
4. Focus on output not elegance
```

**Benefit:** Copilot stays in context. You code 2x faster.

### **Hack 3: Use Prisma Studio for DB Management**
```
Instead of:
$ MySQL client + SQL queries

Use:
$ npx prisma studio
Opens: Visual DB browser on http://localhost:5555
- View/edit/create records
- Relationships
- Run queries

Time saved: 1-2 hours SQL debugging
```

### **Hack 4: Add Seed Data**
```typescript
// prisma/seed.ts
import { prisma } from '@/db';

async function main() {
  await prisma.project.createMany({
    data: [
      { title: 'Smart LED Matrix', category: 'IoT' },
      { title: '3D Printer Enclosure', category: '3D Printing' },
      // ... 18 more
    ],
  });
}

main()
  .then(() => console.log('✅ Seeded'))
  .catch(console.error);

// Run: npx prisma db seed
```

**Benefit:** Development always has realistic data.  
**Time saved:** 30 min setting up test data manually.

### **Hack 5: Automated Tests on Save**
```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "test": "jest --watch",
    "test:e2e": "playwright test"
  }
}
```

Run in parallel terminal:
```bash
Terminal 1: npm run dev
Terminal 2: npm run test
Terminal 3: npm run test:e2e
```

Autofinds bugs while coding.  
**Time saved:** 2 hours per sprint debugging.

### **Hack 6: Use Error Middleware Globally**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    return NextResponse.next();
  } catch (error) {
    console.error('[ERROR]', error);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
```

**Benefit:** All API errors caught + logged.  
**Time saved:** 1 hour debugging error handling.

---

## 🎯 Daily Sprint Tracking (Super Simple)

Use **Jira board** with 4 columns:

```
TO DO        IN PROGRESS        REVIEW        DONE
(Sprint 0)   (Your daily          (Code review  (Push &
 tasks)      work here)           if needed)    close)

Monday:     8 tasks created
Wednesday:  4 tasks in progress (on track)
Friday:     8 tasks closed (success!)
```

**Weekly velocity formula:**
```
Velocity = (Tasks Closed - (In Progress + To Do)) / (Days worked)

Target: 0.5-1 task/day = 5-8 SP/week
```

---

## 🚨 Emergency Mode (If You're Behind)

### **Week by week decision:**

```
Week 2:   On track?        YES → Keep going
                           NO  → Add 2-3 hours/day

Week 4:   On track?        YES → Keep going
                           NO  → Cut "nice-to-haves"

Week 6:   RAG ≥ 85%?       YES → Keep going
                           NO  → EMERGENCY (see below)

Week 8:   PDF working?     YES → Final sprint
                           NO  → EMERGENCY

Week 10:  Everything demo-ready? YES → Polish week
                                  NO  → Cut features
```

### **EMERGENCY PROTOCOL:**

If behind by >1.5 sprints at Week 6:

1. **Cut immediately:**
   - Gamification (medals, rankings)
   - BOM editing (read-only instead)
   - Profile advanced features
   - Mobile optimization

2. **Defer to v1.1:**
   - CV parsing
   - Coautoria
   - Advanced RAG
   - API tokens

3. **Focus on:**
   - Feed works
   - Fork works
   - RAG works
   - PDF exports

**Result:** Lose 15 SP of features, keep 51 SP core  
**New timeline:** Still hit 01 Jul (MVP lite)

---

## 💡 Random Productivity Ideas

```
1. Use VS Code Extensions:
   - Thunder Client (API testing)
   - Prisma (syntax highlight)
   - Tailwind CSS IntelliSense
   - Todo Tree

2. Keep Documentation UPDATED:
   - Each feature → Update README
   - Each schema change → Update diagram
   - No catching up documentation later

3. Use Logs Aggressively:
   console.log('🚀 Starting export', { projectId, timestamp })
   console.log('✅ Export done', { pdfSize, generateTime })
   
   These become your debugging timeline

4. Take Screenshots of UI Progress:
   Each Friday → Screenshot of app
   Build "progress montage"
   Celebrate visually

5. Stand-up with yourself:
   Each day → 2min voice recording of "what I did"
   Helps catch mental blockers
```

---

## 📅 Weekly Velocity Targets

```
Week 1-2:   8 SP (setup overhead, slow)
Week 3-4:   6 SP (learning curve for n8n/RAG)
Week 5-6:   8 SP (hitting stride, parallelized)
Week 7-8:   7 SP (PDF complexity + integration)
Week 9-10:  8 SP (cranking, final features)
Week 11-12: 6 SP (mostly bugs, testing, hardening)
────────────────────────────
TOTAL:      51 SP delivered
TARGET:     51 SP needed
RESULT:     On track ✅
```

If any week (except 1-2) < target:
- **Week 3-4:** Add 1h/day study (n8n docs)
- **Week 5-6:** Activate parallelization hack #3
- **Week 7+:** Cut features immediately

---

## 🎓 Learning Order (Master These Early)

```
Week 1:    Prisma + Next.js routes
Week 2:    React hooks + Shadcn components
Week 3:    n8n webhook + OpenAI API (hardest, do first)
Week 4:    BullMQ + Redis patterns
Week 5:    Postgres/Supabase pgvector
Week 6:    pdfkit template rendering
Week 7+:   Debugging + optimization
```

**Time allocation:** 2h/week for learning days 1-5.

---

## ✅ Final Checklist (Print This Out!)

```
BEFORE WEEK 1:
□ GitHub Codespaces ready
□ Prisma project created
□ Docker compose running
□ Next.js app started
□ Shadcn/UI installed
□ OpenAI API key created
□ Supabase project created
□ BullMQ example running
□ GitHub Actions template set

WEEK 1 EOD:
□ API running on localhost:3000
□ Database with schema
□ 5 seed projects
□ First endpoint tested

WEEK 2 EOD:
□ React pages rendering
□ Components in library
□ CI/CD running
□ All tests passing

WEEK 4 EOD:
□ Embeddings generating
□ n8n workflow defined
□ RAG evaluation ready

WEEK 6 EOD:
□ Feed endpoint live
□ Fork logic working
□ Profile page

WEEK 8 EOD:
□ PDF export generating
□ Queue managing jobs
□ Status tracking

ON DEPLOY DAY:
□ Scalability tested (100 req/s)
□ Backups configured
□ Monitoring active
□ Documentation updated
□ Dependencies audit
```

---

**You got this. Focus. Ship. Iterate. 🚀**
