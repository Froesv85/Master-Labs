# MakerConnect Backend API

IoT Project Governance + Social + Robotics Competition Platform

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Setup (Docker)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Run migrations
docker exec makerconnect-api npm run migrate

# 4. Check health
curl http://localhost:3001/health
```

### Setup (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Configure .env with local database credentials

# 4. Run migrations
npm run migrate

# 5. Start development server
npm run dev
```

## Project Structure

```
src/
├── index.ts                 # Entry point
├── config/
│   ├── database.ts         # Database connection
│   ├── redis.ts            # Redis connection
│   └── env.ts              # Environment config
├── middleware/
│   ├── auth.ts             # JWT authentication
│   └── errorHandler.ts     # Error handling
├── routes/
│   ├── health.ts           # Health check
│   ├── auth.ts             # (TODO) Authentication endpoints
│   ├── users.ts            # (TODO) User endpoints
│   ├── posts.ts            # (TODO) Social feed endpoints
│   ├── projects.ts         # (TODO) Project endpoints
│   ├── robots.ts           # (TODO) Robot endpoints
│   ├── teams.ts            # (TODO) Team endpoints
│   └── communities.ts      # (TODO) Community endpoints
├── services/               # (TODO) Business logic
├── database/
│   ├── migrations/         # Database migrations
│   └── seeds/              # Database seeds
├── types/
│   └── index.ts            # TypeScript interfaces
└── utils/
    ├── logger.ts           # Logging utility
    └── jwt.ts              # JWT utilities
```

## Available Scripts

```bash
# Development
npm run dev                 # Start with hot reload

# Building
npm run build              # Compile TypeScript
npm run start              # Run compiled code

# Database
npm run migrate            # Run all pending migrations
npm run migrate:rollback   # Rollback last migration
npm run db:fresh           # Reset database (rollback all + migrate)

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix linting issues
npm run typecheck          # Type check without compiling

# Testing
npm run test               # Run all tests
npm run test:watch        # Run tests in watch mode
```

## API Endpoints

### Health Check
- `GET /health` - Check API, database, and Redis status

### Authentication (TODO)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT
- `POST /auth/refresh` - Refresh JWT token

### Users (TODO)
- `GET /users/:id/profile` - Get user profile
- `PUT /users/:id/profile` - Update user profile

### Social Feed (TODO)
- `GET /feed` - Get feed with filters
- `POST /posts` - Create new post
- `POST /posts/:id/like` - Like a post
- `POST /posts/:id/comments` - Comment on post

### Projects (TODO)
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `POST /projects/:id/fork` - Fork a project
- `POST /projects/:id/export` - Export as PDF

### Robots (TODO)
- `GET /robot-models` - List robot models
- `POST /robot-models` - Create robot model
- `POST /robot-instances` - Create robot instance
- `POST /robot-instances/:id/matches` - Record match result

### Teams (TODO)
- `POST /teams` - Create team
- `POST /teams/:id/invite` - Invite member

### Communities (TODO)
- `GET /communities` - List communities
- `POST /communities/:id/discussions` - Create discussion

## Database Schema

### Core Entities (6 Epics)
- **E1 (Identity):** users, user_profiles, user_badges, user_hardware_stack, user_follows
- **E2 (Feed):** posts, post_comments, post_likes
- **E3 (Projects):** projects, project_components, project_bom, project_error_logs, project_exports, project_collaborators, project_votes
- **E3 (Robots):** robot_models, robot_instances, robot_matches, robot_rankings, match_logs
- **E4 (Teams):** teams, team_members, team_projects, team_invites
- **E5 (Communities):** communities, community_members, discussions, knowledge_items, knowledge_embeddings
- **E6 (Governance):** audit_logs, ai_pipeline_logs, export_validation_logs, system_health

## Environment Variables

See `.env.example` for full list. Key variables:

```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_NAME=makerconnect
REDIS_HOST=localhost
JWT_SECRET=your_secret_key
```

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Make changes and test**
   ```bash
   npm run dev
   npm run test
   npm run lint:fix
   ```

3. **Create migration if needed**
   ```bash
   # Add migration file in src/database/migrations/
   # Follow naming: YYYYMMDDhhmmss_description.ts
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: description"
   git push origin feature/feature-name
   ```

## Docker Services

### MySQL (Port 3306)
- User: `maker`
- Password: `maker_password_dev`
- Database: `makerconnect`

### Redis (Port 6379)
- Password: `redis_password_dev`
- Used for: caching, job queue (BullMQ)

### MinIO (Port 9000/9001)
- Access Key: `minioadmin`
- Secret Key: `minioadmin`
- Bucket: `makerconnect`
- Web UI: http://localhost:9001

### API (Port 3001)
- Health check: http://localhost:3001/health

## Troubleshooting

### Database connection error
```bash
# Check MySQL is running
docker ps | grep mysql

# Check credentials in .env
# Re-run migrations
npm run migrate
```

### Redis connection error
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost ping
```

### Port already in use
```bash
# Kill process on port 3001
lsof -i :3001
kill -9 <PID>
```

## Architecture

See [docs/arquitetura-tecnica-social-competicao-2026-04-22.md](../docs/arquitetura-tecnica-social-competicao-2026-04-22.md) for:
- Database schema details
- API endpoint specifications
- AI pipeline integration
- Architecture Decision Records (ADRs)

## Team & Ownership

| Component | Owner |
|---|---|
| API Core | Backend-Platform |
| Database | Backend-Platform |
| Auth | Backend-Platform |
| Social Feed | Backend-Platform + Frontend-Experience |
| Projects | Backend-Platform |
| Robots & Ranking | Backend-Platform |
| Teams & Communities | Backend-Platform |
| AI Pipeline Integration | AI-Orchestrator |
| PDF Export | PDF-Automation |

## Next Steps

- [ ] Implement auth endpoints
- [ ] Implement user profile endpoints
- [ ] Implement social feed endpoints
- [ ] Implement project CRUD endpoints
- [ ] Integrate n8n webhook handlers
- [ ] Add comprehensive tests
- [ ] Set up CI/CD pipeline
- [ ] Deploy to staging/production

## License

MIT
