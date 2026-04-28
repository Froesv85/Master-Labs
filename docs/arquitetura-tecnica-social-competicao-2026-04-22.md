# Arquitetura Técnica Detalhada - Social + Competição MakerConnect

**Data:** 2026-04-22  
**Versão:** 1.0  
**Autores:** Architect-FullStack, Backend-Platform  
**Status:** Ready for Implementation (Onda 1)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer (React)                      │
│  Feed | Perfil | Projetos | Robots | Rankings | Communities    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/GraphQL
┌──────────────────────────▼──────────────────────────────────────┐
│                    API Gateway (Node.js)                        │
│  Auth | Feed | Posts | Projects | Robots | Communities | Teams  │
└──────────┬───────────────┬──────────────┬───────────────┬───────┘
           │               │              │               │
    ┌──────▼──────┐  ┌────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
    │   MySQL     │  │  Redis    │ │   S3     │ │  Pinecone   │
    │   (Social   │  │  (Cache   │ │(Assets   │ │  (RAG Vec   │
    │   Graph)    │  │   + Jobs) │ │ Upload)  │ │  DB)        │
    └─────────────┘  └───────────┘ └──────────┘ └─────────────┘
                           │
         ┌─────────────────▼──────────────────┐
         │    n8n Orchestrator (MakerBrain)   │
         │ RAG + CV/NLP + Validation + Logs   │
         └────────────────────────────────────┘
```

---

## 2. Schema de Banco de Dados por Epic

### Epic E1: Identity & Profile

**Tabelas:** `users`, `user_profiles`, `user_badges`, `user_hardware_stack`

```sql
-- users (Core identity)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  lgpd_consent BOOLEAN DEFAULT FALSE,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_created_at (created_at)
);

-- user_profiles (Professional profile)
CREATE TABLE user_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  maker_level ENUM('apprentice', 'journeyman', 'master') DEFAULT 'apprentice',
  expertise_areas JSON, -- ["robotics", "3d-printing", "woodworking"]
  bio_long TEXT,
  github_url VARCHAR(255),
  portfolio_url VARCHAR(255),
  years_of_experience INT,
  total_projects INT DEFAULT 0,
  total_contributions INT DEFAULT 0,
  reputation_score INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_maker_level (maker_level),
  INDEX idx_reputation_score (reputation_score)
);

-- user_badges (Gamification)
CREATE TABLE user_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  badge_type ENUM('first_project', 'first_fork', 'documentation_hero', 'robot_master', 'team_player') NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_badge (user_id, badge_type),
  INDEX idx_user_earned (user_id, earned_at)
);

-- user_hardware_stack (Hardware specialization)
CREATE TABLE user_hardware_stack (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  hardware_category ENUM('microcontroller', 'sensor', 'motor', 'power', 'wireless', 'mechanical') NOT NULL,
  component_name VARCHAR(255), -- "Arduino Uno", "ESP32", "3D Printer Ender3"
  expertise_level ENUM('beginner', 'intermediate', 'expert') DEFAULT 'beginner',
  years_used INT DEFAULT 0,
  projects_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_category (user_id, hardware_category)
);
```

---

### Epic E2: Feed Social

**Tabelas:** `posts`, `post_comments`, `post_likes`, `post_mentions`, `user_follows`

```sql
-- posts (Main feed content)
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  project_id INT, -- FK to projects table (E3)
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_type ENUM('text', 'image', 'video', 'project_update') DEFAULT 'text',
  media_urls JSON, -- ["https://s3.../image1.jpg"]
  visibility ENUM('public', 'followers', 'private') DEFAULT 'public',
  status ENUM('draft', 'published', 'archived') DEFAULT 'published',
  engagement_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_at (created_at),
  INDEX idx_user_status (user_id, status),
  INDEX idx_engagement (engagement_score)
);

-- post_comments (Engagement)
CREATE TABLE post_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post_created (post_id, created_at),
  INDEX idx_user_created (user_id, created_at)
);

-- post_likes (Simple engagement)
CREATE TABLE post_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (post_id, user_id),
  INDEX idx_post (post_id),
  INDEX idx_user (user_id)
);

-- user_follows (Social graph)
CREATE TABLE user_follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, following_id),
  INDEX idx_following (following_id),
  INDEX idx_follower (follower_id)
);
```

---

### Epic E3: Robots & Ranking

**Tabelas:** `robot_models`, `robot_instances`, `robot_matches`, `robot_rankings`, `match_logs`

```sql
-- robot_models (Robot design/template)
CREATE TABLE robot_models (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('autonomous', 'competition', 'industrial', 'educational') DEFAULT 'educational',
  specs JSON, -- {"weight": "500g", "dimensions": "30x20x15cm", "battery": "2S LiPo"}
  bom_id INT, -- FK to projects.bom_id (E3)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
);

-- robot_instances (Actual built robots)
CREATE TABLE robot_instances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  robot_model_id INT NOT NULL,
  user_id INT NOT NULL,
  serial_number VARCHAR(100),
  status ENUM('assembled', 'testing', 'competition', 'archived') DEFAULT 'assembled',
  firmware_version VARCHAR(50),
  build_date DATE,
  build_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (robot_model_id) REFERENCES robot_models(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_user (user_id)
);

-- robot_matches (Competition results)
CREATE TABLE robot_matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  competition_id INT, -- FK to competitions table (E4)
  robot_instance_id INT NOT NULL,
  opponent_instance_id INT,
  match_date DATETIME NOT NULL,
  result ENUM('win', 'loss', 'draw', 'dnf') NOT NULL,
  score_self INT,
  score_opponent INT,
  duration_seconds INT,
  match_log_id INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (robot_instance_id) REFERENCES robot_instances(id) ON DELETE CASCADE,
  INDEX idx_robot_date (robot_instance_id, match_date),
  INDEX idx_result (result),
  INDEX idx_competition (competition_id)
);

-- robot_rankings (Computed rankings)
CREATE TABLE robot_rankings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  robot_instance_id INT UNIQUE NOT NULL,
  user_id INT NOT NULL,
  category ENUM('autonomous', 'competition', 'industrial', 'educational') NOT NULL,
  rank_position INT,
  win_rate DECIMAL(5,2),
  total_matches INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  elo_score INT DEFAULT 1200,
  last_match_date DATETIME,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (robot_instance_id) REFERENCES robot_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category_rank (category, rank_position),
  INDEX idx_elo (elo_score)
);

-- match_logs (Detailed logs for post-match analysis)
CREATE TABLE match_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  log_data LONGTEXT, -- JSON with frame-by-frame data
  telemetry JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES robot_matches(id) ON DELETE CASCADE,
  INDEX idx_match (match_id)
);
```

---

### Epic E4: Teams & Collaboration

**Tabelas:** `teams`, `team_members`, `team_projects`, `team_roles`, `team_invites`

```sql
-- teams (Maker teams)
CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INT NOT NULL,
  logo_url VARCHAR(255),
  visibility ENUM('public', 'private') DEFAULT 'public',
  max_members INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_at (created_at),
  INDEX idx_owner (owner_id)
);

-- team_members (Membership)
CREATE TABLE team_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'admin', 'contributor', 'viewer') DEFAULT 'contributor',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membership (team_id, user_id),
  INDEX idx_team_role (team_id, role)
);

-- team_projects (Projects owned by team)
CREATE TABLE team_projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  project_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_project (team_id, project_id),
  INDEX idx_team (team_id)
);

-- team_invites (Pending invitations)
CREATE TABLE team_invites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  role ENUM('contributor', 'viewer') DEFAULT 'contributor',
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
);
```

---

### Epic E5: Communities & Knowledge

**Tabelas:** `communities`, `community_members`, `discussions`, `knowledge_items`, `knowledge_embeddings`

```sql
-- communities (Interest groups)
CREATE TABLE communities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('robotics', '3d-printing', 'iot', 'woodworking') NOT NULL,
  owner_id INT NOT NULL,
  icon_url VARCHAR(255),
  member_count INT DEFAULT 0,
  visibility ENUM('public', 'private') DEFAULT 'public',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_member_count (member_count)
);

-- community_members (Membership)
CREATE TABLE community_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  community_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'moderator', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member (community_id, user_id),
  INDEX idx_community (community_id)
);

-- discussions (Community threads)
CREATE TABLE discussions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  community_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  tags JSON, -- ["troubleshooting", "beginner"]
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_community_created (community_id, created_at),
  INDEX idx_pinned (pinned)
);

-- knowledge_items (RAG knowledge base)
CREATE TABLE knowledge_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source_type ENUM('post', 'project', 'discussion', 'documentation') NOT NULL,
  source_id INT, -- Post/Project/Discussion ID
  title VARCHAR(255),
  content TEXT NOT NULL,
  metadata JSON, -- {"datasheet": "url", "component": "Arduino", "reliability": 0.92}
  embedding_id INT, -- FK to knowledge_embeddings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_source (source_type, source_id),
  INDEX idx_created (created_at)
);

-- knowledge_embeddings (Vector embeddings for RAG)
CREATE TABLE knowledge_embeddings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  knowledge_item_id INT UNIQUE NOT NULL,
  vector_id VARCHAR(255), -- Pinecone vector ID
  model_name VARCHAR(100) DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (knowledge_item_id) REFERENCES knowledge_items(id) ON DELETE CASCADE,
  INDEX idx_vector (vector_id)
);
```

---

### Epic E3 (Extended): Projects & Governance

**Tabelas:** `projects`, `project_components`, `project_bom`, `project_error_logs`, `project_exports`, `project_collaborators`

```sql
-- projects (Main project entity)
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  creator_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('3d-printing', 'robotics', 'iot', 'woodworking') NOT NULL,
  parent_project_id INT, -- For fork lineage
  status ENUM('draft', 'active', 'archived', 'completed') DEFAULT 'draft',
  difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  estimated_hours INT,
  repository_url VARCHAR(255),
  documentation_url VARCHAR(255),
  thumbnail_url VARCHAR(255),
  view_count INT DEFAULT 0,
  fork_count INT DEFAULT 0,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_project_id) REFERENCES projects(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_parent (parent_project_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  INDEX idx_upvotes (upvote_count)
);

-- project_components (Hardware components used)
CREATE TABLE project_components (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  component_name VARCHAR(255) NOT NULL,
  component_type ENUM('microcontroller', 'sensor', 'motor', 'power', 'wireless', 'mechanical') NOT NULL,
  part_number VARCHAR(100),
  quantity INT DEFAULT 1,
  unit_cost DECIMAL(10,2),
  supplier_url VARCHAR(255),
  datasheet_url VARCHAR(255),
  notes TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_type (project_id, component_type)
);

-- project_bom (Bill of Materials, aggregated)
CREATE TABLE project_bom (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT UNIQUE NOT NULL,
  total_cost DECIMAL(10,2),
  total_weight DECIMAL(10,3),
  component_count INT,
  tool_requirements JSON, -- ["soldering iron", "3d printer"]
  assembly_time_hours INT,
  estimated_difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_cost (total_cost)
);

-- project_error_logs (Troubleshooting database)
CREATE TABLE project_error_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  error_type ENUM('assembly', 'electrical', 'firmware', 'mechanical', 'software', 'other') NOT NULL,
  description TEXT NOT NULL,
  solution TEXT,
  severity ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
  resolved BOOLEAN DEFAULT FALSE,
  helpful_votes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_project_type (project_id, error_type),
  INDEX idx_resolved (resolved)
);

-- project_exports (PDF exports with versioning)
CREATE TABLE project_exports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  export_type ENUM('complete', 'bom-only', 'manual') DEFAULT 'complete',
  export_path VARCHAR(255) NOT NULL,
  status ENUM('queued', 'processing', 'done', 'failed') DEFAULT 'queued',
  exported_by INT,
  ai_enrichment_metadata JSON, -- {"rag_relevance": 0.92, "model": "gpt4", "validation_log": "..."}
  file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (exported_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_project_status (project_id, status),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

-- project_collaborators (Coauthorship)
CREATE TABLE project_collaborators (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('author', 'contributor', 'reviewer') DEFAULT 'contributor',
  contribution_summary TEXT,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_collab (project_id, user_id),
  INDEX idx_project (project_id)
);

-- project_votes (Upvote system)
CREATE TABLE project_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  vote_type ENUM('upvote', 'downvote', 'neutral') DEFAULT 'upvote',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (project_id, user_id),
  INDEX idx_project (project_id),
  INDEX idx_vote_type (vote_type)
);
```

---

### Epic E6: Governance & Observability

**Tabelas:** `audit_logs`, `ai_pipeline_logs`, `export_validation_logs`, `system_health`

```sql
-- audit_logs (Change tracking)
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_type ENUM('project', 'user', 'post', 'robot', 'team') NOT NULL,
  entity_id INT NOT NULL,
  action ENUM('create', 'update', 'delete', 'fork', 'export') NOT NULL,
  user_id INT,
  old_values JSON,
  new_values JSON,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at),
  INDEX idx_user (user_id)
);

-- ai_pipeline_logs (IA orchestration logs)
CREATE TABLE ai_pipeline_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT,
  export_id INT,
  pipeline_stage ENUM('extraction', 'preprocessing', 'rag_retrieval', 'model_inference', 'postprocessing', 'validation') NOT NULL,
  status ENUM('started', 'processing', 'completed', 'failed') NOT NULL,
  duration_ms INT,
  input_tokens INT,
  output_tokens INT,
  rag_relevance_score DECIMAL(5,3),
  validation_result JSON, -- {"schema_valid": true, "completeness": 0.95}
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (export_id) REFERENCES project_exports(id) ON DELETE SET NULL,
  INDEX idx_project (project_id),
  INDEX idx_stage_status (pipeline_stage, status),
  INDEX idx_created (created_at)
);

-- export_validation_logs (Quality assurance)
CREATE TABLE export_validation_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  export_id INT NOT NULL,
  validation_type ENUM('schema', 'completeness', 'consistency', 'accuracy') NOT NULL,
  passed BOOLEAN,
  details JSON, -- {"missing_sections": ["assembly_steps"], "confidence": 0.88}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (export_id) REFERENCES project_exports(id) ON DELETE CASCADE,
  INDEX idx_export (export_id),
  INDEX idx_passed (passed)
);

-- system_health (Monitoring)
CREATE TABLE system_health (
  id INT PRIMARY KEY AUTO_INCREMENT,
  component ENUM('api', 'database', 'cache', 'storage', 'n8n', 'pinecone') NOT NULL,
  status ENUM('healthy', 'degraded', 'down') DEFAULT 'healthy',
  response_time_ms INT,
  error_rate DECIMAL(5,2),
  last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metrics JSON,
  INDEX idx_component (component),
  INDEX idx_last_check (last_check)
);
```

---

## 3. Design de API Endpoints com Payloads

### 3.1 Autenticação & Identidade (E1)

#### `POST /auth/register`
Registra novo maker com validação LGPD.

**Request:**
```json
{
  "email": "maker@example.com",
  "password": "SecurePass123!",
  "username": "maker_pro",
  "display_name": "João Maker",
  "lgpd_consent": true
}
```

**Response (201):**
```json
{
  "id": 1,
  "email": "maker@example.com",
  "username": "maker_pro",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rt_xxxxx",
  "created_at": "2026-04-22T10:30:00Z"
}
```

#### `POST /auth/login`
Autentica usuario e retorna JWT.

**Request:**
```json
{
  "email": "maker@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rt_xxxxx",
  "user": {
    "id": 1,
    "username": "maker_pro",
    "display_name": "João Maker"
  }
}
```

#### `GET /users/:id/profile`
Recupera perfil completo do maker.

**Response (200):**
```json
{
  "id": 1,
  "username": "maker_pro",
  "display_name": "João Maker",
  "bio": "Roboticist & 3D printing enthusiast",
  "maker_level": "journeyman",
  "expertise_areas": ["robotics", "3d-printing"],
  "reputation_score": 245,
  "total_projects": 12,
  "total_contributions": 45,
  "hardware_stack": [
    {
      "category": "microcontroller",
      "component_name": "Arduino Uno",
      "expertise_level": "expert",
      "projects_count": 8
    }
  ],
  "badges": [
    {"type": "first_project", "earned_at": "2025-01-15T00:00:00Z"},
    {"type": "robot_master", "earned_at": "2026-02-10T00:00:00Z"}
  ],
  "follower_count": 142,
  "following_count": 38
}
```

#### `PUT /users/:id/profile`
Atualiza perfil (requer autenticação).

**Request:**
```json
{
  "display_name": "João Maker Pro",
  "bio": "Roboticist, IoT specialist & 3D printing expert",
  "expertise_areas": ["robotics", "3d-printing", "iot"],
  "github_url": "https://github.com/joaomakerpro",
  "years_of_experience": 5
}
```

**Response (200):** Profile atualizado.

---

### 3.2 Feed Social (E2)

#### `GET /feed?category=robotics&limit=20&offset=0`
Recupera feed com filtros.

**Response (200):**
```json
{
  "total": 542,
  "posts": [
    {
      "id": 101,
      "user_id": 5,
      "user": {
        "username": "maker_pro",
        "display_name": "João Maker",
        "avatar_url": "https://avatar.example.com/5.jpg"
      },
      "title": "Built my first autonomous robot!",
      "content": "Just finished assembling...",
      "content_type": "text",
      "media_urls": ["https://s3.../img1.jpg"],
      "engagement_score": 156,
      "like_count": 89,
      "comment_count": 12,
      "created_at": "2026-04-20T14:30:00Z",
      "liked_by_me": false
    }
  ]
}
```

#### `POST /posts`
Cria novo post (requer autenticação).

**Request:**
```json
{
  "title": "Built my first autonomous robot!",
  "content": "Just finished assembling my ESP32-based robot...",
  "content_type": "text",
  "media_urls": ["https://s3.../img1.jpg"],
  "project_id": 42,
  "visibility": "public"
}
```

**Response (201):**
```json
{
  "id": 101,
  "user_id": 5,
  "created_at": "2026-04-22T15:45:00Z",
  "status": "published",
  "url": "/posts/101"
}
```

#### `POST /posts/:id/like`
Marca like em um post (requer autenticação).

**Response (200):**
```json
{
  "liked": true,
  "like_count": 90
}
```

#### `POST /posts/:id/comments`
Adiciona comentário (requer autenticação).

**Request:**
```json
{
  "content": "This is amazing! Did you use ROS?"
}
```

**Response (201):**
```json
{
  "id": 501,
  "post_id": 101,
  "user_id": 7,
  "content": "This is amazing! Did you use ROS?",
  "created_at": "2026-04-22T16:00:00Z"
}
```

---

### 3.3 Projetos & Governança (E3)

#### `POST /projects`
Cria novo projeto (requer autenticação).

**Request:**
```json
{
  "name": "Autonomous Line Follower Robot",
  "description": "A competition-ready robot that follows black lines...",
  "category": "robotics",
  "difficulty_level": "intermediate",
  "estimated_hours": 40,
  "repository_url": "https://github.com/maker/line-follower"
}
```

**Response (201):**
```json
{
  "id": 42,
  "creator_id": 5,
  "name": "Autonomous Line Follower Robot",
  "slug": "autonomous-line-follower-robot",
  "status": "active",
  "created_at": "2026-04-22T10:00:00Z",
  "url": "/projects/42"
}
```

#### `GET /projects/:id`
Recupera projeto completo com BOM, componentes e logs.

**Response (200):**
```json
{
  "id": 42,
  "creator_id": 5,
  "creator": {
    "username": "maker_pro",
    "avatar_url": "https://avatar.example.com/5.jpg"
  },
  "name": "Autonomous Line Follower Robot",
  "description": "A competition-ready robot...",
  "category": "robotics",
  "difficulty_level": "intermediate",
  "estimated_hours": 40,
  "status": "active",
  "view_count": 542,
  "fork_count": 23,
  "upvote_count": 127,
  "fork_lineage": {
    "parent_project_id": null,
    "forks_created": 23
  },
  "bom": {
    "id": 201,
    "total_cost": 156.50,
    "total_weight": 850,
    "component_count": 24,
    "components": [
      {
        "component_name": "Arduino Uno",
        "component_type": "microcontroller",
        "part_number": "A000066",
        "quantity": 1,
        "unit_cost": 22.00,
        "datasheet_url": "https://store.arduino.cc/..."
      }
    ],
    "tool_requirements": ["soldering iron", "multimeter"],
    "assembly_time_hours": 6,
    "estimated_difficulty": "intermediate"
  },
  "error_logs": [
    {
      "id": 1001,
      "error_type": "firmware",
      "description": "Motor not responding to PWM signals",
      "solution": "Check transistor connections, likely bad solder joint",
      "severity": "high",
      "resolved": true,
      "helpful_votes": 34
    }
  ],
  "collaborators": [
    {
      "user_id": 7,
      "username": "helper_bot",
      "role": "contributor",
      "contribution_summary": "Added wireless telemetry module"
    }
  ],
  "created_at": "2026-04-22T10:00:00Z"
}
```

#### `POST /projects/:id/fork`
Cria fork (cópia) de um projeto (requer autenticação).

**Request:**
```json
{
  "name": "My Line Follower Variant",
  "description": "Modified version with additional sensors"
}
```

**Response (201):**
```json
{
  "id": 99,
  "parent_project_id": 42,
  "name": "My Line Follower Variant",
  "creator_id": 12,
  "created_at": "2026-04-22T11:30:00Z",
  "url": "/projects/99"
}
```

#### `POST /projects/:id/components`
Adiciona componente ao BOM (requer autenticação).

**Request:**
```json
{
  "component_name": "HC-SR04 Ultrasonic Sensor",
  "component_type": "sensor",
  "part_number": "HC-SR04",
  "quantity": 2,
  "unit_cost": 3.50,
  "supplier_url": "https://example.com/hc-sr04",
  "datasheet_url": "https://datasheets.com/hc-sr04.pdf"
}
```

**Response (201):**
```json
{
  "id": 202,
  "project_id": 42,
  "created_at": "2026-04-22T12:00:00Z"
}
```

#### `POST /projects/:id/error-logs`
Registra problema ou erro encontrado durante construção.

**Request:**
```json
{
  "error_type": "assembly",
  "description": "Female header spacing doesn't match breadboard holes",
  "solution": "Use male headers instead and solder directly to PCB",
  "severity": "medium",
  "resolved": true
}
```

**Response (201):**
```json
{
  "id": 1002,
  "project_id": 42,
  "user_id": 12,
  "created_at": "2026-04-22T12:15:00Z"
}
```

#### `POST /projects/:id/export`
Inicia exportação assíncrona de PDF com IA.

**Request:**
```json
{
  "export_type": "complete",
  "include_error_logs": true,
  "include_ai_suggestions": true
}
```

**Response (202 Accepted):**
```json
{
  "export_id": 5001,
  "project_id": 42,
  "status": "queued",
  "estimated_wait_seconds": 45,
  "check_status_url": "/projects/42/exports/5001",
  "created_at": "2026-04-22T12:30:00Z"
}
```

#### `GET /projects/:id/exports/:export_id`
Verifica status da exportação (polling).

**Response (200):**
```json
{
  "id": 5001,
  "project_id": 42,
  "status": "processing",
  "progress_percent": 65,
  "current_stage": "rag_retrieval",
  "download_url": null,
  "created_at": "2026-04-22T12:30:00Z",
  "started_at": "2026-04-22T12:31:00Z",
  "estimated_completion_seconds": 20
}
```

**Response (200) quando pronto:**
```json
{
  "id": 5001,
  "status": "done",
  "download_url": "https://s3.../projects/42/export-5001.pdf",
  "file_size": 2458624,
  "validation_report": {
    "schema_valid": true,
    "completeness": 0.94,
    "rag_relevance": 0.92,
    "sections_included": ["cover", "bom", "assembly", "error_solutions", "firmware"]
  },
  "completed_at": "2026-04-22T12:45:00Z"
}
```

---

### 3.4 Robots & Ranking (E3)

#### `POST /robot-models`
Cria modelo de robot (requer autenticação).

**Request:**
```json
{
  "project_id": 42,
  "name": "Competition Line Follower v2",
  "description": "Optimized for speed and precision",
  "category": "competition",
  "specs": {
    "weight": "480g",
    "dimensions": "32x24x18cm",
    "battery": "2S LiPo",
    "max_speed": "2.5m/s"
  }
}
```

**Response (201):**
```json
{
  "id": 301,
  "project_id": 42,
  "name": "Competition Line Follower v2",
  "created_at": "2026-04-22T14:00:00Z"
}
```

#### `POST /robot-instances`
Registra instância fisica de um robot (requer autenticação).

**Request:**
```json
{
  "robot_model_id": 301,
  "serial_number": "ROBOT-42-001",
  "status": "competition",
  "firmware_version": "2.1.0",
  "build_date": "2026-04-20",
  "build_notes": "Final tweaks on motor timing"
}
```

**Response (201):**
```json
{
  "id": 401,
  "robot_model_id": 301,
  "user_id": 5,
  "serial_number": "ROBOT-42-001",
  "status": "competition",
  "created_at": "2026-04-22T14:15:00Z"
}
```

#### `POST /robot-instances/:id/matches`
Registra resultado de partida/competição.

**Request:**
```json
{
  "match_date": "2026-04-22T16:30:00Z",
  "result": "win",
  "score_self": 95,
  "score_opponent": 87,
  "duration_seconds": 180,
  "notes": "Consistent line following, no false positives"
}
```

**Response (201):**
```json
{
  "id": 501,
  "robot_instance_id": 401,
  "result": "win",
  "created_at": "2026-04-22T16:35:00Z"
}
```

#### `GET /robot-rankings?category=competition`
Recupera rankings de robots por categoria.

**Response (200):**
```json
{
  "category": "competition",
  "total_robots": 145,
  "rankings": [
    {
      "rank": 1,
      "robot_instance_id": 401,
      "user": {
        "id": 5,
        "username": "maker_pro"
      },
      "robot_name": "Competition Line Follower v2",
      "elo_score": 1680,
      "win_rate": 0.92,
      "total_matches": 50,
      "wins": 46,
      "losses": 4,
      "last_match": "2026-04-22T16:35:00Z"
    }
  ]
}
```

---

### 3.5 Teams & Comunidades (E4, E5)

#### `POST /teams`
Cria novo time (requer autenticação).

**Request:**
```json
{
  "name": "Robotics Warriors",
  "description": "Competitive robotics team focused on line following",
  "max_members": 8
}
```

**Response (201):**
```json
{
  "id": 601,
  "name": "Robotics Warriors",
  "owner_id": 5,
  "created_at": "2026-04-22T10:00:00Z"
}
```

#### `POST /teams/:id/invite`
Convida usuario para time (requer autenticação como owner/admin).

**Request:**
```json
{
  "email": "newmember@example.com",
  "role": "contributor"
}
```

**Response (201):**
```json
{
  "invite_id": 701,
  "team_id": 601,
  "email": "newmember@example.com",
  "token": "invite_token_xxxxx",
  "expires_at": "2026-04-29T10:00:00Z"
}
```

#### `GET /communities?category=robotics`
Lista comunidades por categoria.

**Response (200):**
```json
{
  "total": 42,
  "communities": [
    {
      "id": 801,
      "name": "Line Following Robotics",
      "description": "Techniques and tips for line following competitions",
      "category": "robotics",
      "member_count": 234,
      "owner": {
        "id": 5,
        "username": "maker_pro"
      },
      "joined_by_me": true
    }
  ]
}
```

#### `POST /communities/:id/discussions`
Cria nova discussão em comunidade (requer autenticação).

**Request:**
```json
{
  "title": "Best practices for sensor calibration?",
  "content": "I'm having trouble with sensor drift in my robot...",
  "tags": ["troubleshooting", "sensors"]
}
```

**Response (201):**
```json
{
  "id": 901,
  "community_id": 801,
  "user_id": 12,
  "created_at": "2026-04-22T15:30:00Z"
}
```

---

### 3.6 Governance & Observability (E6)

#### `GET /projects/:id/audit-trail`
Recupera histórico de alterações do projeto (requer autenticação).

**Response (200):**
```json
{
  "project_id": 42,
  "total_changes": 67,
  "changes": [
    {
      "id": 10001,
      "action": "update",
      "user": {
        "id": 5,
        "username": "maker_pro"
      },
      "old_values": {"difficulty_level": "beginner"},
      "new_values": {"difficulty_level": "intermediate"},
      "created_at": "2026-04-22T14:00:00Z"
    },
    {
      "id": 10002,
      "action": "fork",
      "user": {
        "id": 12,
        "username": "helper_bot"
      },
      "metadata": {"fork_id": 99},
      "created_at": "2026-04-22T11:30:00Z"
    }
  ]
}
```

#### `GET /projects/:id/exports/:export_id/validation-report`
Recupera relatório de validação da exportação.

**Response (200):**
```json
{
  "export_id": 5001,
  "project_id": 42,
  "validations": [
    {
      "type": "schema",
      "passed": true,
      "details": {"pdf_structure": "valid"}
    },
    {
      "type": "completeness",
      "passed": true,
      "details": {
        "completeness_score": 0.94,
        "missing_sections": []
      }
    },
    {
      "type": "consistency",
      "passed": true,
      "details": {"component_references_match": true}
    },
    {
      "type": "accuracy",
      "passed": true,
      "details": {
        "rag_relevance_score": 0.92,
        "confidence": 0.88
      }
    }
  ],
  "overall_status": "valid",
  "generated_at": "2026-04-22T12:45:00Z"
}
```

---

## 4. Fluxo de Integração: Social + IA Pipeline

### 4.1 Arquitetura do Fluxo End-to-End

```
┌──────────────────────────────────────────────────────────────────┐
│ Maker cria/atualiza projeto (POST /projects ou PUT /projects/:id) │
└───────────────┬──────────────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────┐
        │ API Node.js       │
        │ - Valida input    │
        │ - Cria record     │
        │ - Publica evento  │
        └───────────┬───────┘
                    │
                    ▼
        ┌───────────────────────────────────────┐
        │ Webhook: project.created/updated      │
        │ Publica em Redis: project:42:updated  │
        └───────────┬──────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────────────────┐
        │ n8n MakerBrain Orchestrator (Trigger)    │
        │ Escuta: project:*:updated                │
        │ Payload: {project_id, action, data}      │
        └──────────────┬───────────────────────────┘
                       │
        ┌──────────────▼────────────────────────────────────────┐
        │ STAGE 1: EXTRACTION (n8n node)                       │
        │ - Parse project metadata, BOM, error_logs            │
        │ - Normalize technical data (datasheets, components)  │
        │ - Anonymize PII (LGPD)                               │
        │ → Output: structured_data {components, specs, logs}  │
        └──────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────▼────────────────────────────────────────┐
        │ STAGE 2: PREPROCESSING (n8n node)                    │
        │ - Validate schema consistency                        │
        │ - Generate chunks for RAG (max 512 tokens)           │
        │ - Call embedding API (OpenAI text-embedding-3)       │
        │ - Create knowledge_items + embeddings in DB          │
        │ → Output: {chunk_ids[], embedding_ids[]}             │
        └──────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────▼────────────────────────────────────────┐
        │ STAGE 3: RAG RETRIEVAL (n8n + Pinecone)             │
        │ - Query vector DB for relevant datasheets/docs       │
        │ - Re-rank by domain expertise (robotics/IoT)         │
        │ - Fetch top-5 similar projects from community        │
        │ - Validate relevance > 0.80 threshold                │
        │ → Output: {evidence[], references[]}                 │
        └──────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────▼────────────────────────────────────────┐
        │ STAGE 4: MODEL INFERENCE (n8n + GPT-4o)             │
        │ - System prompt: MakerBrain domain-specific          │
        │ - Input: project_data + RAG_evidence                 │
        │ - Output: structured documentation (JSON)            │
        │ - Generation: assembly steps, warnings, optimizations│
        │ → Output: {doc_structure, suggestions[]}             │
        └──────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────▼────────────────────────────────────────┐
        │ STAGE 5: POSTPROCESSING (n8n node)                   │
        │ - Render markdown/HTML from structured output        │
        │ - Insert RAG evidence citations                      │
        │ - Generate audit trail (validation_log)              │
        │ - Store in project_exports (status: processing)      │
        │ → Output: {markdown_content, validation_data}        │
        └──────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────▼────────────────────────────────────────┐
        │ STAGE 6: PDF GENERATION + STORAGE (Worker)           │
        │ - Receive markdown + BOM + images from n8n           │
        │ - Call Puppeteer (Chrome headless) for PDF render    │
        │ - Upload to S3 with signed URL                       │
        │ - Update project_exports: status = done              │
        │ → Output: {pdf_url, file_size, s3_path}              │
        └──────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────▼────────────────────────────────────────┐
        │ VALIDATION LAYER (n8n final node)                    │
        │ - Schema validation (PDF structure)                  │
        │ - Completeness check (all sections present)          │
        │ - Consistency check (component references match)     │
        │ - Accuracy check (RAG relevance > 0.80)              │
        │ - Log results in export_validation_logs              │
        └──────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────▼──────────────────────────────────────┐
        │ UPDATE STATUS + NOTIFY                               │
        │ - Update project_exports.status = 'done'             │
        │ - Create post in social feed: "PDF ready!"           │
        │ - Log ai_pipeline_logs with metrics                  │
        │ - Notify user (email/webhook)                        │
        └──────────────────────────────────────────────────────┘
```

### 4.2 Fluxo de Integração: Social Feed + IA Suggestions

```
Maker publica post com projeto relacionado
        │
        ▼
API: POST /posts (requer project_id)
        │
        ▼
Webhook: post.published
        │
        ▼
n8n: Detecta novo post sobre projeto
        │
        ├─→ Query RAG: "posts similares" (comunidades)
        │
        ├─→ Call GPT-4o: "Gere sugestões de improvements"
        │
        └─→ Create post_suggestions record (async)
                │
                ▼
        Social API: GET /posts/:id/ai-suggestions
        (Retorna sugestões da comunidade + IA)
```

### 4.3 Diagrama de Jobs Assíncronos

```
┌────────────────────────────────────────────┐
│ BullMQ Job Queue (Redis)                   │
├────────────────────────────────────────────┤
│ export.pdf       (priority: high)           │
│ embed.knowledge  (priority: normal)         │
│ rag.retrieve     (priority: normal)         │
│ validate.export  (priority: normal)         │
│ cleanup.old_exports (priority: low, cron)  │
└────────────────────────────────────────────┘
        │
        ▼
    ┌────────────────────┐
    │ Workers            │
    ├────────────────────┤
    │ 2x PDF renderer    │
    │ 1x Embedding gen   │
    │ 1x Validator       │
    │ 1x Scheduler       │
    └────────────────────┘
```

---

## 5. Architecture Decision Records (ADRs)

### ADR-E2-001: Social Feed Visibility Model

**Status:** Accepted  
**Context:** Makers precisam compartilhar projetos de forma segura, mas também querem visibilidade.  
**Decision:** Implementar 3 níveis de visibility: `public`, `followers`, `private`.  
**Rationale:** 
- `public`: máxima exposição, bom para SEO e descoberta
- `followers`: apenas seguidores podem ver (builder community)
- `private`: only for coauthors (work-in-progress projects)

**Consequences:**
- API query sempre filtra por visibility + user role
- Feed performance: índice em (user_id, status, visibility)

---

### ADR-E3-001: Project Fork Lineage Tracking

**Status:** Accepted  
**Context:** Makers querem iterar em projetos existentes. Precisa rastrear origem.  
**Decision:** Adicionar `parent_project_id` em projects table; manter count de forks.  
**Rationale:**
- Rastreabilidade: cada fork aponta para seu ancestral
- Governance: log de quem criou cada versão
- Reputação: projetos com muitos forks ganham status

**Consequences:**
- Tabela projects cresce com fork lineage, mas indices rápidos
- API GET /projects/:id retorna fork_lineage completo
- Audit logs registram cada ação de fork

---

### ADR-E3-002: Asynchronous PDF Export with Status Polling

**Status:** Accepted  
**Context:** Exportação PDF é I/O intensivo (n8n + Puppeteer), pode levar 30-60s.  
**Decision:** Implementar job queue (BullMQ) + status endpoint para polling.  
**Rationale:**
- Não bloqueia API (resposta rápida 202 Accepted)
- Maker pode fechar aba e voltar depois
- Suporta webhooks para notificações real-time (futura melhoria)

**Consequences:**
- projeto_exports.status: `queued` → `processing` → `done` ou `failed`
- Cliente poll GET /projects/:id/exports/:export_id a cada 2-5 segundos
- Implementar cleanup job para excluir exports com > 30 dias

---

### ADR-E3-003: BOM Component Normalization

**Status:** Accepted  
**Context:** Makers entram com parte numbers diferentes (Arduino vs A000066).  
**Decision:** Normalizar para canonical part number + manter aliases.  
**Rationale:**
- RAG busca por componente padrão (melhor relevância)
- Datasheets linkados a canonical part
- Comunidade vê que "Arduino Uno" = "A000066"

**Consequences:**
- Tabela project_components indexa por canonical part_number
- Maintenance: manter database de part aliases atualizada

---

### ADR-E3-004: Error Logs as Community Knowledge

**Status:** Accepted  
**Context:** Troubleshooting é maior dificuldade em maker projects.  
**Decision:** Publicar error_logs como knowledge_items para RAG + feed social.  
**Rationale:**
- Reutilização: outro maker enfrenta mesmo erro, vê solução
- Gamification: resolver erros ganha badges
- IA pode sugerir soluções similares em real-time

**Consequences:**
- error_logs.resolved + solution → embeddings no Pinecone
- Social feed pode mostrar "trending problems" por projeto
- Moderação necessária para evitar conteúdo spam

---

### ADR-E5-001: Communities as Knowledge Collections

**Status:** Accepted  
**Context:** Makers querem agrupar conhecimento por interesse (ex: "Line Following").  
**Decision:** Communities = channels de discussão + curated knowledge (pinned discussions + linked projects).  
**Rationale:**
- Better discoverability than flat feed
- Experts can moderate + maintain quality
- RAG retrieval prioriza community pinned content

**Consequences:**
- communities.id é chave para RAG retrieval (boost de relevância)
- API: GET /communities/:id/knowledge retorna merged view (discussions + projects)

---

### ADR-E6-001: LGPD Compliance for External API Calls

**Status:** Accepted  
**Context:** Makers no Brasil, dados sujeitos a LGPD; LLMs externos armazenam dados.  
**Decision:** Anonymize PII antes de qualquer chamada a GPT-4o/Pinecone.  
**Rationale:**
- Não transmitir nomes, emails, ou dados pessoais
- Apenas project metadata técnico (componentes, specs)
- Logging de consentimento: audit_logs.metadata.lgpd_consent_given

**Consequences:**
- n8n preprocessing node remove: user names, emails, timestamps personalizadas
- Documentação de data processor (OpenAI, Pinecone) para DPA
- Opção de opt-out na profile do usuario

---

### ADR-E6-002: Immutable Audit Logs for Export Validation

**Status:** Accepted  
**Context:** Precisa rastrear cada estágio de exportação para governança.  
**Decision:** Todos os ai_pipeline_logs e export_validation_logs são INSERT ONLY (nunca UPDATE/DELETE).  
**Rationale:**
- Compliance: prova de validação para auditoria
- Reproducibility: cada versão do PDF tem log de como foi gerado
- Debugging: rastrear qual estágio falhou + motivo

**Consequences:**
- Tabelas audit_logs, ai_pipeline_logs, export_validation_logs nunca sofrem DELETE
- Implementar cleanup jobs apenas para deletar dados > 1 ano

---

### ADR-E6-003: Health Checks for Critical Components

**Status:** Accepted  
**Context:** Pipeline IA falha silenciosamente se n8n, Pinecone ou S3 cair.  
**Decision:** Health check table + monitoring job que pinga dependências a cada 30s.  
**Rationale:**
- Rápida detecção de falhas
- API pode retornar degraded status em tempo real
- Alerts para DevOps

**Consequences:**
- Tabela system_health com registros de último check
- GET /health retorna aggregate status
- Monitoramento via Prometheus + alertas (futura implementação)

---

## 6. Matriz de Responsabilidades por Onda

| Componente | Onda 1 | Onda 2 | Onda 3 | Responsável |
|---|---|---|---|---|
| Database Schema (E1-E6) | ✓ | - | - | Backend-Platform |
| API Endpoints (Auth, Feed, Projects) | ✓ | - | - | Backend-Platform |
| Social Feed UI (React) | ✓ | - | - | Frontend-Experience |
| Profile + Hardware Stack UI | ✓ | - | - | Frontend-Experience |
| n8n RAG Workflow | ✓ | ✓ | - | AI-Orchestrator |
| PDF Export + Puppeteer Worker | ✓ | ✓ | - | PDF-Automation |
| Robot Models + Instances | - | ✓ | - | Backend-Platform |
| Rankings + Match System | - | ✓ | - | Backend-Platform |
| Teams + Collaboration API | - | ✓ | - | Backend-Platform |
| Communities + Knowledge Base | ✓ | - | ✓ | AI-Orchestrator |
| Governance + Audit Logs | - | - | ✓ | Backend-Platform |
| Performance Optimization | - | - | ✓ | Backend-Platform |

---

## 7. Checklist de Implementação Onda 1

- [ ] Database: Schema SQL criado (E1-E6)
- [ ] API: Auth endpoints (register, login, refresh token)
- [ ] API: User profile endpoints (GET, PUT)
- [ ] API: Posts endpoints (CREATE, GET, LIKE, COMMENT)
- [ ] API: Projects endpoints (CREATE, GET, FORK, COMPONENTS)
- [ ] API: Error logs endpoints (CREATE, GET)
- [ ] Redis: Configuração de cache + BullMQ
- [ ] S3/Minio: Configuração de upload de assets
- [ ] n8n: Workflow de RAG básico
- [ ] n8n: Webhook handlers para project.created/updated
- [ ] Puppeteer: Configuração de PDF render worker
- [ ] Frontend: Feed React component
- [ ] Frontend: Profile React component
- [ ] Frontend: Project detail page
- [ ] Frontend: Create project form
- [ ] Tests: Unit tests para API endpoints
- [ ] Tests: Integration tests (API + Database)
- [ ] Deployment: Docker + docker-compose
- [ ] Documentation: API reference no Swagger/OpenAPI

---

**Próximo passo:** Architect-FullStack validar decisões; Backend-Platform começar implementação Onda 1.

