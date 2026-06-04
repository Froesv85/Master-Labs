# Onda 1 - Testes de Validação (Windows)

**Data:** 2026-04-22  
**Ambiente:** Windows (PowerShell)  
**Objetivo:** Executar testes completos de todos os 33 endpoints

---

## ✅ Pré-requisitos

- [x] Docker Desktop instalado e rodando
- [x] PowerShell 5.1+ ou PowerShell 7 (Core)
- [x] Git Bash ou WSL (opcional, para comandos Unix)
- [x] Código completo em `maker-connect/` (Onda 1 ✅)

---

## 🚀 Guia de Execução (Passo a Passo)

### Passo 1: Preparar Ambiente
```powershell
# Abrir PowerShell como Administrator
# (Admin pode ser necessário para Docker)

cd "c:\Users\ViniciusFroes\OneDrive - A3C Tecnologia\Área de Trabalho\7 Semestre\PAC\Master-Labs-main\maker-connect\backend"

# Verificar se Docker Desktop está rodando
docker ps

# Se erro, iniciar Docker Desktop manualmente (buscar no Menu Iniciar)
```

### Passo 2: Iniciar Serviços (docker-compose)
```powershell
# Terminal 1 - Manter aberto durante testes
docker-compose up

# Aguardar até ver:
# [+] Running 4/4
#   ✔ Container mysql-1       Healthy
#   ✔ Container redis-1       Healthy
#   ✔ Container api-1         Healthy
#   ✔ Container minio-1       Healthy

# Isso leva ~30-60 segundos na primeira execução
```

### Passo 3: Executar Migrations (em novo Terminal)
```powershell
# Terminal 2 - Novo PowerShell
cd "c:\Users\ViniciusFroes\OneDrive - A3C Tecnologia\Área de Trabalho\7 Semestre\PAC\Master-Labs-main\maker-connect\backend"

# Instalar dependências (primeira execução)
npm install

# Executar migrations
npm run migrate

# Esperado: output moendo com sucesso
# "Batch 1 complete (3 migrations run)."
# ou similar
```

### Passo 4: Iniciar Servidor API (em novo Terminal)
```powershell
# Terminal 3 - Novo PowerShell
cd "c:\Users\ViniciusFroes\OneDrive - A3C Tecnologia\Área de Trabalho\7 Semestre\PAC\Master-Labs-main\maker-connect\backend"

# Iniciar servidor em modo dev
npm run dev

# Esperado:
# [API] Server running on port 3001
# [API] Listening on http://localhost:3001
# [API] Health check available at /health
```

### Passo 5: Executar Testes (em novo Terminal)
```powershell
# Terminal 4 - Novo PowerShell (para testes)
cd "c:\Users\ViniciusFroes\OneDrive - A3C Tecnologia\Área de Trabalho\7 Semestre\PAC\Master-Labs-main\maker-connect\backend"

# Executar suite completa de testes
.\test-onda1.ps1

# Ou com output verboso:
.\test-onda1.ps1 -Verbose

# Ou se preferir bash (WSL/Git Bash):
bash test-onda1.sh
```

---

## 📊 Testes Executados

### Resumo dos Testes
```
[1/7] Health Check
  ✓ GET /health → 200 OK

[2/7] Authentication (4 endpoints, 4 testes)
  ✓ POST /auth/register → 201 (new user + tokens)
  ✓ POST /auth/login → 200 (existing user)
  ✓ POST /auth/validate → 200 (token valid)
  ✓ POST /auth/refresh → 200 (new token pair)

[3/7] User Profile (7 endpoints, 7 testes)
  ✓ GET /users/:id/profile → 200 (public)
  ✓ PUT /users/:id/profile → 200 (owner only)
  ✓ POST /users/:id/follow → 201 (protected)
  ✓ DELETE /users/:id/follow → 204 (protected)
  ✓ GET /users/:id/followers → 200 (paginated)
  ✓ GET /users/:id/following → 200 (paginated)
  ✓ GET /users/:id/check-following/:targetId → 200 (boolean)

[4/7] Social Feed (7 endpoints, 7 testes)
  ✓ POST /posts → 201 (create)
  ✓ GET /posts/feed → 200 (with filters/sorting)
  ✓ GET /posts/:id → 200 (visibility checked)
  ✓ POST /posts/:id/like → 200 (engage)
  ✓ DELETE /posts/:id/like → 200 (disengage)
  ✓ POST /posts/:id/comments → 201 (add comment)
  ✓ GET /posts/:id/comments → 200 (paginated)

[5/7] Projects (13 endpoints, 10 testes)
  ✓ POST /projects → 201 (create)
  ✓ GET /projects/:id → 200 (details)
  ✓ GET /projects → 200 (list with filters)
  ✓ POST /projects/:id/components → 201 (BOM)
  ✓ GET /projects/:id/components → 200 (get BOM)
  ✓ POST /projects/:id/error-logs → 201 (troubleshooting)
  ✓ GET /projects/:id/error-logs → 200 (get logs)
  ✓ POST /projects/:id/upvote → 200 (voting)
  ✓ PUT /projects/:id → 200 (update)
  ✓ POST /projects/:id/fork → 201 (clone)

[6/7] Robots (7 endpoints, 7 testes)
  ✓ POST /robots/models → 201 (create model)
  ✓ GET /robots/models → 200 (list)
  ✓ GET /robots/models/:id → 200 (details)
  ✓ POST /robots/instances → 201 (build instance)
  ✓ GET /robots/instances/:id → 200 (details)
  ✓ GET /robots/instances/:id/matches → 200 (history)
  ✓ GET /robots/rankings → 200 (leaderboard)

Total: 33+ endpoints testados
Expected Pass Rate: 100%
```

---

## 🔍 Entender os Resultados

### ✓ PASS (Verde)
```
✓ PASS - POST /auth/register
```
Significa: Endpoint retornou status esperado + dados válidos.

### ✗ FAIL (Vermelho)
```
✗ FAIL - POST /projects/:id/fork
Details: HTTP 403 Unauthorized
```
Significa: 
- Endpoint retornou erro inesperado, OU
- Resposta não tem estrutura esperada, OU
- Validação de dados falhou

**Próximos passos:** Verificar logs no Terminal 3 (npm run dev)

---

## 🐛 Troubleshooting

### Erro: "Connection refused" ou "HTTP 404"
```
✗ FAIL - Health Check
Details: HTTPError: ...Connection refused...
```
**Solução:** 
```powershell
# Verificar se docker-compose está rodando (Terminal 1)
docker ps

# Se vazio, iniciar novamente:
docker-compose up

# Aguardar 30+ segundos até "Healthy"
```

### Erro: "POST /auth/register FAIL: 400 Bad Request"
```
Details: Validation error: password too weak
```
**Solução:** 
Script já usa senha `TestPass123!Secure` que atende requisitos. Se erro persistir:
- Verificar logs em Terminal 3
- Resetar banco: `docker-compose down -v` + `docker-compose up`

### Erro: "No such file or directory: test-onda1.ps1"
```powershell
# Verificar localização correta
cd maker-connect\backend
ls test-onda1.*

# Se arquivo não existe:
# Voltar para editor e criar arquivo test-onda1.ps1
```

### Erro: "PowerShell is not digitally signed"
```powershell
# Se aparecer erro de execução policy:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Depois rodar teste novamente:
.\test-onda1.ps1
```

### Erro: "Docker daemon is not running"
**Solução:** 
1. Abrir Docker Desktop (procurar no Menu Iniciar)
2. Aguardar inicialização completa (~1 min)
3. Tentar novamente: `docker ps`

---

## 📈 Performance Esperada

```
Test Execution Time
├─ Health Check: ~100ms
├─ Auth (4 endpoints): ~800ms
├─ Users (7 endpoints): ~600ms
├─ Posts (7 endpoints): ~1200ms
├─ Projects (10 endpoints): ~1500ms
├─ Robots (7 endpoints): ~800ms
└─ Total: ~5-6 segundos

Database Queries per Test
├─ Auth: 5-10 (register + profile creation)
├─ Posts: 3-5 (visibility filtering)
├─ Projects: 2-8 (complex joins)
└─ All: ~100-150 queries total
```

---

## 📋 Checklist Pré-Demo (D5)

- [ ] Todos 33 endpoints passando (100% green)
- [ ] Nenhum erro 500 (Internal Server Error)
- [ ] Todos status codes corretos (201 para create, 200 para get/update, 204 para delete)
- [ ] Validações funcionando (400 para bad input)
- [ ] Autenticação funcionando (401 para token inválido)
- [ ] Permissions funcionando (403 para acesso negado)
- [ ] Dados persistindo em banco (verificar via Docker logs)
- [ ] Documentação (docs/API.md) atualizada
- [ ] Testes reportados a stakeholders

---

## 🔄 Reutilizar Testes

### Adicionar novo endpoint a teste
1. Abrir `test-onda1.ps1` em editor
2. Localizar função relevante, ex: `Test-Projects`
3. Adicionar bloco:
```powershell
# Test: New Feature
try {
  $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
  $body = @{ field = "value" } | ConvertTo-Json
  
  $response = Invoke-WebRequest -Uri "$BaseUrl/projects/new-endpoint" `
    -Method POST `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $body
  
  $data = $response.Content | ConvertFrom-Json
  
  if ($data.data.expectedField) {
    LogTest "POST /projects/new-endpoint" "PASS"
  } else {
    LogTest "POST /projects/new-endpoint" "FAIL"
  }
} catch {
  LogTest "POST /projects/new-endpoint" "FAIL" $_.Exception.Message
}
```

### Executar teste específico
```powershell
# Editar test-onda1.ps1, comentar funções desnecessárias
# Ex: comentar "Test-Robots" se só testar Projects

# .\test-onda1.ps1  # Executar todos
Test-Projects        # Executar só esta função
```

---

## 📁 Estrutura Final Esperada

```
maker-connect/
├─ backend/
│  ├─ src/
│  │  ├─ index.ts                    ✅
│  │  ├─ middleware/
│  │  ├─ services/
│  │  ├─ routes/
│  │  ├─ config/
│  │  ├─ database/migrations/
│  │  └─ utils/
│  │
│  ├─ test-onda1.ps1                 ✅ (33 endpoints)
│  ├─ test-onda1.sh                  ✅ (33 endpoints)
│  ├─ docker-compose.yml             ✅
│  ├─ Dockerfile                     ✅
│  ├─ package.json                   ✅
│  └─ .env.example                   ✅
│
└─ docs/
   ├─ API.md                         ✅ (completa)
   ├─ onda-1-status.md               ✅ (resumo)
   └─ onda-2-planejamento.md         ✅ (próxima fase)
```

---

## 🎯 Próximos Passos (Após Validação)

1. **Fixar Bugs** (se houver) - Sprint D1-D3
2. **Onda 2 Kickoff** - Teams + Communities (paralelo com D5 demo prep)
3. **Integration Tests** - Layer 1 (TestContainers)
4. **n8n Workflow** - Design + testing
5. **Final Demo** - D10 (documentação + AI pipeline)

---

**Status:** 🟢 Pronto para Testes  
**Última atualização:** 2026-04-22  
**Próximo review:** Após execução dos testes
