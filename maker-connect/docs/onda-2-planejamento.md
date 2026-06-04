# Onda 2 - MakerConnect Backend: Teams + Communities + n8n Integration

**Data de Planejamento:** 2026-04-22  
**Status:** 📋 Planejamento Detalhado  
**Estimativa:** 5-7 dias (paralelo com testes de Onda 1)

---

## 🎯 Objetivo Onda 2

Completar a plataforma com:
1. **Teams API** (Gestão de equipes de projeto)
2. **Communities API** (Comunidades temáticas + discussions + knowledge base)
3. **n8n Webhook Integration** (AI pipeline callbacks + async job tracking)
4. **Async Job Queue** (Bull.js + PDF export)
5. **Integration Tests** (Camada 1: TestContainers)

---

## 📊 Escopo Detalhado

### Epic 4: Teams Management (6 métodos + 8 endpoints)

#### Schema Adicional (já em migration)
```sql
-- Tabelas já definidas na migration 20260422000000_initial_schema.ts
teams (
  id, user_id (owner), name, description, is_public,
  created_at, updated_at
)

team_members (
  id, team_id, user_id, role (owner/admin/member),
  joined_at
)

team_projects (
  id, team_id, project_id, added_by_user_id,
  created_at
)

team_invites (
  id, team_id, email, role, status (pending/accepted/rejected),
  expires_at, created_at
)
```

#### Service Methods (6)
```typescript
class TeamService {
  // CRUD
  async createTeam(userId, payload): TeamResponse
  async getTeamById(teamId, userId?): TeamResponse
  async listTeams(filters): {teams: TeamResponse[], total}
  async updateTeam(teamId, userId, payload): TeamResponse
  async deleteTeam(teamId, userId): void
  
  // Members
  async addMember(teamId, userId, memberId, role): void
  async removeMember(teamId, userId, memberId): void
  async listMembers(teamId): TeamMember[]
  
  // Projects
  async addProject(teamId, userId, projectId): void
  async removeProject(teamId, userId, projectId): void
  async getTeamProjects(teamId): Project[]
  
  // Invites
  async inviteUser(teamId, userId, email, role, expiresAt): void
  async acceptInvite(teamId, inviteId, userId): void
  async rejectInvite(inviteId, userId): void
  async getPendingInvites(teamId): TeamInvite[]
}
```

#### Endpoints (8)
```
POST   /teams                           # Create team
GET    /teams                           # List teams
GET    /teams/:id                       # Get team details
PUT    /teams/:id                       # Update team
DELETE /teams/:id                       # Delete team
POST   /teams/:id/members               # Add member
DELETE /teams/:id/members/:userId       # Remove member
GET    /teams/:id/members               # List members
POST   /teams/:id/projects              # Add project
DELETE /teams/:id/projects/:projectId   # Remove project
GET    /teams/:id/projects              # Get team projects
POST   /teams/:id/invites               # Send invite
POST   /teams/:id/invites/:inviteId/accept  # Accept invite
DELETE /teams/:id/invites/:inviteId     # Reject invite
GET    /teams/:id/invites               # List pending invites
```

#### Key Design Decisions
- **Ownership:** Team owner pode deletar, admins podem gerenciar membros
- **Visibility:** is_public = listável em /teams, private = membros only
- **Invites:** Email-based com expiration (7 dias default)
- **Role-based:** owner > admin > member (progressivo em privilégios)
- **Project Ownership:** Project owner OU team owner pode adicionar projeto ao team

---

### Epic 5: Communities + Knowledge Base (7 métodos + 12 endpoints)

#### Schema Adicional
```sql
communities (
  id, user_id (creator), name, description, category,
  member_count, is_public, created_at, updated_at
)

community_members (
  id, community_id, user_id, role (founder/moderator/member),
  joined_at
)

discussions (
  id, community_id, user_id (starter), title, content,
  status (open/closed/locked), views_count,
  created_at, updated_at
)

knowledge_items (
  id, community_id, user_id (author), title, content,
  content_type (guide/faq/tutorial/reference),
  embeddings (VECTOR type for RAG), approval_status,
  created_at, updated_at
)

knowledge_embeddings (
  id, knowledge_item_id, embedding (vector),
  metadata (JSON), created_at
)
```

#### Service Methods (7)
```typescript
class CommunityService {
  // CRUD
  async createCommunity(userId, payload): CommunityResponse
  async getCommunityById(communityId): CommunityResponse
  async listCommunities(filters): {communities, total}
  async updateCommunity(communityId, userId, payload): CommunityResponse
  async deleteCommunity(communityId, userId): void
  
  // Members
  async joinCommunity(communityId, userId): void
  async leaveCommunity(communityId, userId): void
  async listMembers(communityId, limit, offset): CommunityMember[]
  
  // Discussions
  async startDiscussion(communityId, userId, payload): DiscussionResponse
  async getDiscussion(discussionId): DiscussionResponse
  async listDiscussions(communityId, limit, offset): Discussion[]
  async replyToDiscussion(discussionId, userId, content): Reply
  async getReplies(discussionId, limit, offset): Reply[]
  async closeDiscussion(discussionId, userId): void
  
  // Knowledge Base
  async addKnowledgeItem(communityId, userId, payload): KnowledgeResponse
  async getKnowledgeItem(itemId): KnowledgeResponse
  async listKnowledgeItems(communityId, contentType?, limit, offset): Knowledge[]
  async updateKnowledgeItem(itemId, userId, payload): KnowledgeResponse
  async deleteKnowledgeItem(itemId, userId): void
  
  // RAG Integration
  async indexKnowledgeItem(itemId, content): void  # Gera embedding
  async searchKnowledge(query, limit): KnowledgeResponse[]  # Vector search
}
```

#### Endpoints (12)
```
POST   /communities                      # Create community
GET    /communities                      # List communities
GET    /communities/:id                  # Get community details
PUT    /communities/:id                  # Update community
DELETE /communities/:id                  # Delete community

POST   /communities/:id/members/join     # Join community
DELETE /communities/:id/members/leave    # Leave community
GET    /communities/:id/members          # List members

POST   /communities/:id/discussions      # Start discussion
GET    /communities/:id/discussions      # List discussions
GET    /communities/:id/discussions/:discussionId  # Get discussion
POST   /communities/:id/discussions/:discussionId/replies  # Reply
GET    /communities/:id/discussions/:discussionId/replies  # Get replies
DELETE /communities/:id/discussions/:discussionId  # Close discussion

POST   /communities/:id/knowledge        # Add knowledge item
GET    /communities/:id/knowledge        # List knowledge items
GET    /communities/:id/knowledge/:itemId  # Get knowledge item
PUT    /communities/:id/knowledge/:itemId  # Update knowledge item
DELETE /communities/:id/knowledge/:itemId  # Delete knowledge item

GET    /communities/:id/knowledge/search # Vector search knowledge
```

#### Key Design Decisions
- **Moderation:** Discussions podem ser closed/locked por moderators
- **Knowledge Types:** guide, faq, tutorial, reference para filtros
- **Embeddings:** Gerados via Pinecone/Supabase Vector (background job)
- **RAG Integration:** Knowledge items indexados para busca semântica
- **Approval Status:** pending/approved/rejected (moderator review)
- **Searchability:** Comunidades públicas aparecem em search global

---

## 🔗 n8n Integration & Async Jobs

### Webhook Handlers (Nova Rota)

#### New Endpoint
```typescript
// POST /webhooks/n8n - Receives AI pipeline callbacks
export const webhooksRouter = Router();

webhooksRouter.post('/n8n', authenticateWebhookSecret, async (req, res) => {
  const { eventType, projectId, exportId, status, result, error, metadata } = req.body;
  
  // eventType: 'pdf_export_queued' | 'pdf_export_processing' | 'pdf_export_done' | 'ai_extraction_done'
  
  switch(eventType) {
    case 'pdf_export_done':
      // Update project_exports.status = 'done'
      // Save file URL in project_exports.file_url
      // Log in export_validation_logs
      break;
      
    case 'ai_extraction_done':
      // Update project_error_logs or project_metadata with AI results
      // Index in Pinecone for RAG
      // Trigger next pipeline stage
      break;
  }
  
  res.json({ received: true });
});
```

### PDF Export Queue (Bull.js)

#### Job Definition
```typescript
interface PDFExportJob {
  projectId: number;
  exportId: number;
  userId: number;
  format: 'full' | 'bom_only' | 'documentation';
  includeAI: boolean;  // Include AI-generated content
}

const pdfQueue = new Bull('pdf-export', {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

pdfQueue.process(async (job) => {
  const { projectId, exportId, userId, format, includeAI } = job.data;
  
  // 1. Fetch project data
  // 2. Fetch components (BOM)
  // 3. If includeAI: fetch AI-enhanced documentation from project_exports
  // 4. Use Puppeteer to render HTML → PDF
  // 5. Upload to S3
  // 6. POST /webhooks/n8n with success
  // 7. Update project_exports.status = 'done'
});

pdfQueue.on('completed', (job, result) => {
  logger.info('PDF export completed', { jobId: job.id, exportId: job.data.exportId });
});

pdfQueue.on('failed', (job, err) => {
  logger.error('PDF export failed', { jobId: job.id, error: err.message });
  // Update project_exports.status = 'failed'
});
```

### Export Flow Diagram
```
1. User POST /projects/:id/export?format=full
   ↓
2. Create project_exports record (status: queued)
   ↓
3. Add job to Bull queue
   ↓
4. Return exportId + status to user
   ↓
5. [Async] Bull worker processes PDF
   ↓
6. [Async] Call n8n webhook: POST /webhooks/n8n
   ↓
7. [Sync] Webhook handler updates project_exports.status = 'done'
   ↓
8. User polls GET /projects/:id/exports/:exportId to check status
   ↓
9. When ready, download file from S3
```

### AI Pipeline Webhook Integration

#### Flow (n8n orchestrates)
```
1. Project created/updated → Trigger n8n via project webhook
   ↓
2. n8n workflow:
   a) Extract project data (components, error logs) via API
   b) Run CV on images (if present): detect components, PCB layouts
   c) Generate embeddings for project metadata
   d) RAG: retrieve similar projects + solutions
   e) Generate enhanced documentation + recommendations
   f) POST /webhooks/n8n with results
   ↓
3. Handler updates project with AI results
   ↓
4. Frontend queries project to get AI-enhanced content
```

#### Webhook Secret Auth
```typescript
function authenticateWebhookSecret(req, res, next) {
  const signature = req.headers['x-n8n-signature'];
  const webhook_secret = process.env.N8N_WEBHOOK_SECRET;
  
  const hash = crypto
    .createHmac('sha256', webhook_secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== hash) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
}
```

---

## 🧪 Integration Tests (Camada 1: TestContainers)

### Test Structure
```typescript
// tests/integration/layer1-testcontainers.test.ts

describe('Layer 1: TestContainers - Infrastructure', () => {
  let container: GenericContainer;
  let db: Knex;
  let redis: RedisClient;
  
  beforeAll(async () => {
    // Start MySQL container
    const mysqlContainer = await new GenericContainer('mysql:8.0')
      .withEnvironment({ MYSQL_ROOT_PASSWORD: 'test', MYSQL_DATABASE: 'test' })
      .withExposedPorts(3306)
      .start();
    
    // Start Redis container
    const redisContainer = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();
    
    // Connect DB
    db = knex({
      client: 'mysql2',
      connection: {
        host: mysqlContainer.getHost(),
        port: mysqlContainer.getMappedPort(3306),
        user: 'root',
        password: 'test',
        database: 'test',
      },
    });
    
    // Run migrations
    await db.migrate.latest();
  });
  
  afterAll(async () => {
    await mysqlContainer.stop();
    await redisContainer.stop();
  });
  
  test('Should create team and add members', async () => {
    const teamId = await teamService.createTeam(1, {
      name: 'Robotics Club',
      description: 'IoT robotics enthusiasts'
    });
    
    expect(teamId).toBeGreaterThan(0);
    
    const team = await teamService.getTeamById(teamId);
    expect(team.name).toBe('Robotics Club');
  });
  
  test('Should create community and post discussion', async () => {
    const communityId = await communityService.createCommunity(1, {
      name: '3D Printing Enthusiasts',
      category: '3D Printing',
      description: 'Share projects and tips'
    });
    
    const discussionId = await communityService.startDiscussion(
      communityId, 
      1,
      { title: 'Best materials?', content: 'What are your favorite materials?' }
    );
    
    expect(discussionId).toBeGreaterThan(0);
  });
});
```

---

## 📋 Checklist Implementação Onda 2

### Week 1 (Days 1-3)
- [ ] **Teams Service + Routes** (Day 1)
  - [ ] `src/services/team.service.ts` (6 métodos)
  - [ ] `src/routes/teams.ts` (8 endpoints)
  - [ ] Import em `src/index.ts`
  - [ ] Update `docs/API.md`

- [ ] **Communities Service + Routes** (Day 2)
  - [ ] `src/services/community.service.ts` (7 métodos)
  - [ ] `src/routes/communities.ts` (12 endpoints)
  - [ ] Import em `src/index.ts`
  - [ ] Update `docs/API.md`

- [ ] **Webhooks + Bull Queue** (Day 3)
  - [ ] `src/routes/webhooks.ts` (n8n receiver)
  - [ ] `src/jobs/pdf-export.job.ts` (Bull.js)
  - [ ] `src/services/export.service.ts` (PDF logic)
  - [ ] Environment variables para Bull + n8n

### Week 2 (Days 4-5)
- [ ] **Integration Tests Layer 1** (Day 4)
  - [ ] `tests/integration/layer1-testcontainers.test.ts`
  - [ ] Setup TestContainers
  - [ ] Basic CRUD tests per service

- [ ] **n8n Workflow Design** (Day 5)
  - [ ] Design workflow in n8n UI
  - [ ] Test webhooks
  - [ ] Documentation

### Week 2+ (Days 6-7)
- [ ] **Smoke Tests + End-to-End** (Day 6)
- [ ] **Bug fixes + optimization** (Day 7)
- [ ] **Final demo preparation**

---

## 📊 Dependências Onda 2

### Novos Pacotes NPM
```json
{
  "bull": "^4.11.3",        // Job queue
  "puppeteer": "^19.0.0",   // PDF generation
  "ioredis": "^5.3.2",      // Redis client (for Bull)
  "@pinecone-database/pinecone": "^1.1.0",  // Vector DB
  "jest": "^29.0.0",        // Testing
  "testcontainers": "^9.0.0"  // Integration tests
}
```

### Environment Variables (Adicionar)
```env
# Bull + Job Queue
REDIS_URL=redis://redis:6379
BULL_QUEUE_NAME=makerconnect-jobs

# n8n Integration
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/makerconnect
N8N_WEBHOOK_SECRET=your_secret_key
N8N_API_KEY=your_api_key

# PDF Export
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PDF_STORAGE_BUCKET=makerconnect-exports
MAX_PDF_PROCESSING_TIMEOUT=60000

# Pinecone (RAG)
PINECONE_API_KEY=pc-xxx
PINECONE_INDEX=makerconnect-knowledge
PINECONE_ENVIRONMENT=us-west1-gcp
```

---

## 🎯 Success Criteria Onda 2

### Functional
- ✅ 20 novos endpoints implementados (Teams + Communities)
- ✅ Bull queue processando PDFs asincronamente
- ✅ Webhooks recebendo callbacks n8n
- ✅ Discussões + knowledge base funcionando
- ✅ RAG indexando items de knowledge

### Performance
- ✅ PDF export < 30s (timeout)
- ✅ Webhook response < 100ms
- ✅ Discussion list < 500ms
- ✅ Knowledge search (semantic) < 1s

### Testing
- ✅ Layer 1 tests com TestContainers
- ✅ Cobertura mínima 70%
- ✅ Todos os webhooks testados

### Documentation
- ✅ API.md atualizado com 20 endpoints
- ✅ n8n workflow documentado
- ✅ Job queue operations documented

---

## 📈 Progresso Esperado

```
Onda 1 (Completa) ✅
├─ Auth (4 endpoints)
├─ Users (7 endpoints)
├─ Posts (6 endpoints)
├─ Projects (13 endpoints)
└─ Robots (7 endpoints)

Onda 2 (Planejada) 🔲
├─ Teams (8 endpoints)
├─ Communities (12 endpoints)
├─ Webhooks + Jobs (2 endpoints)
├─ Integration Tests (Layer 1)
└─ n8n Workflow Design

Total Endpoints Onda 2: 33 + 22 = 55 endpoints
Timeline: 5-7 dias
Status: Ready to start
```

---

## 🚀 Handoff para Onda 2

**Quando iniciar:** Após validação de Onda 1 (D5 demo checkpoint)

**Parallelizable work:**
- Teams implementation (não depende de Communities)
- Integration test setup (pode rodar em paralelo)
- n8n workflow design (enquanto backend é feito)

**Blocker removido:** Onda 1 é completamente independente, Onda 2 pode começar em paralelo

---

**Documento criado:** 2026-04-22  
**Status:** 📋 Pronto para implementação  
**Próximo passo:** Iniciar testes de Onda 1, depois kickoff de Onda 2
