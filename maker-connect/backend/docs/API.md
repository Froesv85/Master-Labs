# MakerConnect API Documentation - Onda 1

**Data:** 2026-04-22  
**Status:** ✅ Endpoints Implemented (Auth + Users + Posts)  
**Base URL:** `http://localhost:3001` (dev) | `https://api.makerconnect.io` (prod)

---

## 📋 Implementado nesta Onda 1

- ✅ **Authentication Endpoints** (3 endpoints)
- ✅ **User Profile Endpoints** (6 endpoints)
- ✅ **Social Feed Endpoints** (6 endpoints)

---

## 🔐 Authentication Endpoints

### POST /auth/register
Registra novo usuário Maker com validação LGPD.

**Request:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maker@example.com",
    "password": "SecurePass123!",
    "username": "maker_pro",
    "display_name": "João Maker",
    "lgpd_consent": true
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": 1,
    "email": "maker@example.com",
    "username": "maker_pro",
    "display_name": "João Maker",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "rt_xxxxx",
    "created_at": "2026-04-22T10:30:00Z"
  },
  "message": "User registered successfully",
  "timestamp": "2026-04-22T10:30:00Z"
}
```

**Error Responses:**
- `400` - Missing required fields (email, password, username)
- `400` - Password must be at least 8 characters
- `400` - LGPD consent is required
- `409` - Email already registered
- `409` - Username already taken

---

### POST /auth/login
Autentica usuário e retorna JWT tokens.

**Request:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maker@example.com",
    "password": "SecurePass123!"
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "email": "maker@example.com",
    "username": "maker_pro",
    "display_name": "João Maker",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "rt_xxxxx",
    "created_at": "2026-04-22T10:30:00Z"
  },
  "message": "Login successful",
  "timestamp": "2026-04-22T10:35:00Z"
}
```

**Error Responses:**
- `400` - Email and password are required
- `401` - Invalid email or password
- `403` - User account is inactive

---

### POST /auth/refresh
Renova JWT token usando refresh token.

**Request:**
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "rt_xxxxx"
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "rt_new_token"
  },
  "message": "Token refreshed successfully",
  "timestamp": "2026-04-22T10:40:00Z"
}
```

---

## 👤 User Profile Endpoints

### GET /users/:id/profile
Recupera perfil público de um usuário.

**Request:**
```bash
curl http://localhost:3001/users/1/profile
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "username": "maker_pro",
    "display_name": "João Maker",
    "bio": "Roboticist & 3D printing enthusiast",
    "avatar_url": "https://s3.../avatar.jpg",
    "maker_level": "journeyman",
    "expertise_areas": ["robotics", "3d-printing"],
    "reputation_score": 245,
    "total_projects": 12,
    "total_contributions": 45,
    "github_url": "https://github.com/joaomakerpro",
    "portfolio_url": "https://portfolio.example.com",
    "years_of_experience": 5,
    "follower_count": 142,
    "following_count": 38,
    "created_at": "2026-01-15T00:00:00Z"
  },
  "timestamp": "2026-04-22T10:45:00Z"
}
```

---

### PUT /users/:id/profile
Atualiza perfil do usuário (requer autenticação).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```bash
curl -X PUT http://localhost:3001/users/1/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "João Maker Pro",
    "bio": "Roboticist, IoT specialist & 3D printing expert",
    "avatar_url": "https://s3.../new-avatar.jpg",
    "github_url": "https://github.com/joaomakerpro",
    "portfolio_url": "https://portfolio.example.com",
    "expertise_areas": ["robotics", "3d-printing", "iot"],
    "years_of_experience": 6
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "username": "maker_pro",
    "display_name": "João Maker Pro",
    "bio": "Roboticist, IoT specialist & 3D printing expert",
    ...
  },
  "message": "Profile updated successfully",
  "timestamp": "2026-04-22T10:50:00Z"
}
```

**Errors:**
- `401` - Missing or invalid authorization
- `403` - Can only update own profile
- `404` - User not found

---

### POST /users/:id/follow
Segue um usuário (requer autenticação).

**Request:**
```bash
curl -X POST http://localhost:3001/users/5/follow \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (201 Created):**
```json
{
  "message": "User followed successfully",
  "timestamp": "2026-04-22T10:55:00Z"
}
```

**Errors:**
- `400` - You cannot follow yourself
- `401` - User not authenticated
- `404` - User to follow not found
- `409` - Already following this user

---

### DELETE /users/:id/follow
Deixa de seguir um usuário (requer autenticação).

**Request:**
```bash
curl -X DELETE http://localhost:3001/users/5/follow \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "User unfollowed successfully",
  "timestamp": "2026-04-22T11:00:00Z"
}
```

---

### GET /users/:id/followers
Lista seguidores de um usuário (público).

**Query Parameters:**
- `limit` (optional, max 100): 20 (default)
- `offset` (optional): 0 (default)

**Request:**
```bash
curl "http://localhost:3001/users/1/followers?limit=10&offset=0"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 3,
      "username": "follower1",
      "display_name": "Follower One",
      "avatar_url": "https://s3.../avatar.jpg"
    }
  ],
  "limit": 10,
  "offset": 0,
  "timestamp": "2026-04-22T11:05:00Z"
}
```

---

### GET /users/:id/following
Lista usuários que um usuário segue (público).

**Query Parameters:** Same as `/followers`

**Request:**
```bash
curl "http://localhost:3001/users/1/following?limit=10&offset=0"
```

---

## 📰 Social Feed Endpoints

### GET /posts/feed
Recupera feed com filtros (opcional auth para personalização).

**Query Parameters:**
- `limit` (optional, max 100): 20 (default)
- `offset` (optional): 0 (default)
- `sort` (optional): `newest` (default) | `trending` | `popular`

**Request (Unauthenticated):**
```bash
curl "http://localhost:3001/posts/feed?limit=20&offset=0&sort=newest"
```

**Request (Authenticated):**
```bash
curl "http://localhost:3001/posts/feed?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "data": {
    "posts": [
      {
        "id": 101,
        "user_id": 5,
        "user": {
          "id": 5,
          "username": "maker_pro",
          "display_name": "João Maker",
          "avatar_url": "https://s3.../avatar.jpg"
        },
        "title": "Built my first autonomous robot!",
        "content": "Just finished assembling my ESP32-based robot...",
        "content_type": "text",
        "media_urls": ["https://s3.../img1.jpg"],
        "visibility": "public",
        "status": "published",
        "engagement_score": 156,
        "like_count": 89,
        "comment_count": 12,
        "liked_by_me": false,
        "created_at": "2026-04-20T14:30:00Z",
        "updated_at": "2026-04-20T14:30:00Z"
      }
    ],
    "total": 542,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "timestamp": "2026-04-22T11:10:00Z"
}
```

---

### POST /posts
Cria novo post (requer autenticação).

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request:**
```bash
curl -X POST http://localhost:3001/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Built my first autonomous robot!",
    "content": "Just finished assembling my ESP32-based robot with line following sensors...",
    "content_type": "text",
    "media_urls": ["https://s3.../img1.jpg", "https://s3.../img2.jpg"],
    "project_id": 42,
    "visibility": "public"
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": 101,
    "user_id": 5,
    "user": {
      "id": 5,
      "username": "maker_pro",
      "display_name": "João Maker",
      "avatar_url": "https://s3.../avatar.jpg"
    },
    "title": "Built my first autonomous robot!",
    "content": "Just finished assembling...",
    "content_type": "text",
    "media_urls": ["https://s3.../img1.jpg"],
    "visibility": "public",
    "status": "published",
    "engagement_score": 0,
    "like_count": 0,
    "comment_count": 0,
    "created_at": "2026-04-22T11:15:00Z",
    "updated_at": "2026-04-22T11:15:00Z"
  },
  "message": "Post created successfully",
  "timestamp": "2026-04-22T11:15:00Z"
}
```

**Errors:**
- `400` - Title and content are required
- `401` - User not authenticated
- `404` - Project not found (if project_id provided)

---

### GET /posts/:id
Recupera detalhes de um post específico (opcional auth).

**Request:**
```bash
curl "http://localhost:3001/posts/101" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):** Same as feed response (single post)

---

### POST /posts/:id/like
Marca like em um post (requer autenticação).

**Request:**
```bash
curl -X POST http://localhost:3001/posts/101/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (201 Created):**
```json
{
  "message": "Post liked successfully",
  "timestamp": "2026-04-22T11:20:00Z"
}
```

**Errors:**
- `401` - User not authenticated
- `404` - Post not found
- `409` - Already liked this post

---

### DELETE /posts/:id/like
Remove like de um post (requer autenticação).

**Request:**
```bash
curl -X DELETE http://localhost:3001/posts/101/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "Post unliked successfully",
  "timestamp": "2026-04-22T11:25:00Z"
}
```

---

### POST /posts/:id/comments
Adiciona comentário em um post (requer autenticação).

**Request:**
```bash
curl -X POST http://localhost:3001/posts/101/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is amazing! Did you use ROS?"
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "id": 501,
    "post_id": 101,
    "user_id": 7,
    "content": "This is amazing! Did you use ROS?",
    "username": "helper_bot",
    "display_name": "Helper Bot",
    "avatar_url": "https://s3.../avatar.jpg",
    "created_at": "2026-04-22T11:30:00Z",
    "updated_at": "2026-04-22T11:30:00Z"
  },
  "message": "Comment added successfully",
  "timestamp": "2026-04-22T11:30:00Z"
}
```

**Errors:**
- `400` - Comment content is required
- `400` - Comment must be less than 2000 characters
- `401` - User not authenticated
- `404` - Post not found

---

### GET /posts/:id/comments
Lista comentários de um post (opcional auth).

**Query Parameters:**
- `limit` (optional, max 100): 20 (default)
- `offset` (optional): 0 (default)

**Request:**
```bash
curl "http://localhost:3001/posts/101/comments?limit=10"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 501,
      "post_id": 101,
      "user_id": 7,
      "content": "This is amazing! Did you use ROS?",
      "username": "helper_bot",
      "display_name": "Helper Bot",
      "avatar_url": "https://s3.../avatar.jpg",
      "created_at": "2026-04-22T11:30:00Z",
      "updated_at": "2026-04-22T11:30:00Z"
    }
  ],
  "limit": 10,
  "offset": 0,
  "timestamp": "2026-04-22T11:35:00Z"
}
```

---

## 🔑 Authentication

### JWT Token Usage

Adicione o token no header `Authorization`:

```bash
curl http://localhost:3001/protected-endpoint \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Lifetimes
- **Access Token:** 24 hours
- **Refresh Token:** 7 days

### Token Refresh Flow

```bash
# 1. Login to get tokens
curl -X POST http://localhost:3001/auth/login \
  -d '{"email": "user@example.com", "password": "password"}'

# Returns: { token, refresh_token }

# 2. When token expires, use refresh_token
curl -X POST http://localhost:3001/auth/refresh \
  -d '{"refresh_token": "rt_xxxxx"}'

# Returns: { token, refresh_token } (new tokens)
```

---

## 📊 Response Format

Todos os endpoints retornam resposta estruturada:

### Success Response (2xx)
```json
{
  "data": { /* entity or array */ },
  "message": "Optional success message",
  "timestamp": "2026-04-22T12:00:00Z"
}
```

### Error Response (4xx, 5xx)
```json
{
  "error": "Error message",
  "details": { /* optional details */ },
  "timestamp": "2026-04-22T12:00:00Z"
}
```

---

## 🧪 Testing com cURL

### Exemplo: Registrar, Login, e Criar Post

```bash
#!/bin/bash

# 1. Register
REGISTER=$(curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "username": "testuser",
    "display_name": "Test User",
    "lgpd_consent": true
  }')

TOKEN=$(echo $REGISTER | jq -r '.data.token')
echo "Token: $TOKEN"

# 2. Update Profile
curl -X PUT http://localhost:3001/users/1/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Test User Pro",
    "bio": "Testing the API"
  }'

# 3. Create Post
curl -X POST http://localhost:3001/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is my first post on MakerConnect!",
    "visibility": "public"
  }'

# 4. Get Feed
curl "http://localhost:3001/posts/feed?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚠️ Common Errors

### 401 Unauthorized
- Token ausente ou inválido
- Token expirado (use refresh endpoint)

### 403 Forbidden
- Tentando atualizar perfil de outro usuário
- Falta de permissões

### 404 Not Found
- Recurso não existe
- ID inválido

### 409 Conflict
- Tentando fazer ação duplicada (ex: like 2x, follow 2x)
- Email/username já registrado

---

## 📈 Rate Limiting (Future)

Será implementado na Onda 2:
- 100 requests/minute por usuário
- 1000 requests/minute por IP (public endpoints)

---

## 🚀 Próximas Ondas

### Onda 2 (Projects + Robots)
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `POST /projects/:id/fork` - Fork project
- `POST /robot-models` - Create robot model
- `POST /robot-instances/:id/matches` - Record match

### Onda 3 (Teams + Communities + Governance)
- Teams management
- Communities + discussions
- Audit trails
- AI Pipeline webhooks

---

**Documentação gerada:** 2026-04-22  
**Última atualização:** 2026-04-22 11:40:00Z  
**Status:** ✅ Onda 1 Endpoints Completos
