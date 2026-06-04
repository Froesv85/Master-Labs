#!/usr/bin/env pwsh
# Atualização Jira — S1B Quality Gate (25 Abril 2026)

param(
    [string]$JiraUrl = "https://catolicasc-team-ra944io4.atlassian.net",
    [string]$Email   = "vinicius.froes@catolicasc.edu.br",
    [string]$ApiKey  = "ATATT3xFfGF0zrTdPFIi0SYPwpefdi3Uqbwiy0_rlety4F3SJ59DwOc9CWu69xcINENnhwXVB5yzhb9VS2cmk2PKr76GZIFcdeye85M51cEF2fFQpb0I7L07qObd3JucLqQSIHPAV3UcwLWtw-QdTHSoTijTkqq6RLrvLpzNlom7SRtMdekv2MQ=D5BD66B0"
)

$base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${Email}:${ApiKey}"))
$headers = @{
    "Authorization" = "Basic $base64"
    "Content-Type"  = "application/json"
    "Accept"        = "application/json"
}

$issues = @(
    @{
        Key    = "ML-56"
        Comment = "[2026-04-25][S1B-PREREQS DONE] Todas pendencias da Semana 1 concluidas antes do prazo. README maker-connect v1.0 publicado com stack, arquitetura, API reference e data model. Jest 30 + ts-jest framework instalado. 63 unit tests em 13 suites - todos passando (0 falhas). Code coverage: Statements 92.97%, Branches 85.09%, Functions 97.14%. Meta >75% EXCEDIDA. S1B quality gate APROVADO."
    },
    @{
        Key    = "ML-91"
        Comment = "[2026-04-25][S1B-QUALITY] Feed API completamente validada com unit tests. GET /api/projects: paginacao (page/pageSize max 50), sort (newest/oldest/top), filtro categoria com mapping 3D_Printing->Printing3D. POST /api/projects: validacao titulo/categoria. 9 testes cobrindo happy path + edge cases. Coverage: 92% statements, 85% branches."
    },
    @{
        Key    = "ML-85"
        Comment = "[2026-04-25][S1B-QUALITY] API Communities implementada e testada. GET /api/communities: retorna apenas comunidades publicas (isPublic=true). POST /api/communities: validacao nome + categoria enum. GET /api/communities/[id]: 200 sucesso, 404 nao encontrada, 400 id invalido. 5 testes unitarios, coverage 100% para communities/[id]."
    },
    @{
        Key    = "ML-84"
        Comment = "[2026-04-25][S1B-QUALITY] API communities/[id] GET testada: 200 sucesso com members/posts, 404 comunidade inexistente, 400 id invalido (nao numerico). Cobre consulta individual necessaria para fluxo de adesao e aprovacao."
    },
    @{
        Key    = "ML-93"
        Comment = "[2026-04-25][S1B-QUALITY] Projects POST testado: 201 criacao, 400 titulo vazio, 400 categoria invalida. Vote POST testado: novo voto (cria), voto duplicado (nao duplica), 404 projeto, 400 usuario ausente. Fork POST testado: 201 fork com titulo sufixo (Fork) + parentId correto, 404, 400."
    },
    @{
        Key    = "ML-95"
        Comment = "[2026-04-25][S1B-QUALITY] User profile APIs testadas. GET /api/users/[id]: 200 perfil completo, 404, 400 id invalido. PATCH /api/users/[id]: 200 via transaction, 400 id invalido. GET /api/profile: por email ou userId, 400 userId invalido, 404. PATCH /api/profile: atualiza language, 400 missing fields."
    }
)

Write-Host "`n🚀 Atualizacao Jira — S1B Quality Gate (25/04/2026)" -ForegroundColor Cyan
Write-Host "====================================================`n"

# Teste de conexão
Write-Host "🔍 Testando conexao..." -ForegroundColor Yellow
try {
    $me = Invoke-RestMethod -Uri "$JiraUrl/rest/api/3/myself" -Headers $headers -Method GET
    Write-Host "✅ Autenticado como: $($me.displayName)`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Falha na autenticacao: $_" -ForegroundColor Red
    exit 1
}

$ok = 0; $fail = 0

foreach ($issue in $issues) {
    Write-Host "📝 $($issue.Key) — adicionando comentario..." -ForegroundColor Yellow

    $body = @{
        body = @{
            version = 1
            type    = "doc"
            content = @(@{
                type    = "paragraph"
                content = @(@{ type = "text"; text = $issue.Comment })
            })
        }
    } | ConvertTo-Json -Depth 10

    try {
        Invoke-RestMethod -Uri "$JiraUrl/rest/api/3/issue/$($issue.Key)/comment" `
            -Headers $headers -Method POST -Body $body | Out-Null
        Write-Host "   ✅ Comentario adicionado" -ForegroundColor Green
        $ok++
    } catch {
        Write-Host "   ❌ Erro: $_" -ForegroundColor Red
        $fail++
    }
    Write-Host ""
}

Write-Host "====================================================`n"
Write-Host "📊 Resultado: $ok sucesso / $fail erro / $($issues.Count) total"
if ($fail -eq 0) {
    Write-Host "SUCESSO: Todos os tickets atualizados!" -ForegroundColor Green
} else {
    Write-Host "ATENCAO: Verifique os erros acima." -ForegroundColor Yellow
}
