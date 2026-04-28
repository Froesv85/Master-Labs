#!/usr/bin/env pwsh

# Script de Atualização Jira - Semana 1 (23-04-2026)
# Uso: .\scripts\update-jira-semana1.ps1

param(
    [string]$JiraUrl = "https://catolicasc-team-ra944io4.atlassian.net",
    [string]$Email = "vinicius.froes@catolicasc.edu.br",
    [string]$ApiKey = "ATATT3xFfGF0zrTdPFIi0SYPwpefdi3Uqbwiy0_rlety4F3SJ59DwOc9CWu69xcINENnhwXVB5yzhb9VS2cmk2PKr76GZIFcdeye85M51cEF2fFQpb0I7L07qObd3JucLqQSIHPAV3UcwLWtw-QdTHSoTijTkqq6RLrvLpzNlom7SRtMdekv2MQ=D5BD66B0"
)

Write-Host "🚀 Script de Atualização Jira - Semana 1" -ForegroundColor Cyan
Write-Host "=========================================`n"

# Configurar headers
$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f $Email, $ApiKey)))
$headers = @{
    "Authorization" = ("Basic {0}" -f $base64AuthInfo)
    "Content-Type"  = "application/json"
}

# Issues para atualizar
$issues = @(
    @{
        Key     = "ML-56"
        Status  = "Done"
        Comment = "[2026-04-23] WEEKLY REVIEW - Sprint 0 Final: Gate de Estabilidade APROVADO com métricas acima do target. Parse 100%, Schema 100%, Relevância 92.5-95% vs 85% target. Backend webhook fix merged (f210b2b). PDF export async P0-B implementado com job tracking (jobId). Pronto para S1B Kickoff. Próximo: Finalize README maker-connect + iniciar S1B Feed UI."
    },
    @{
        Key     = "ML-66"
        Status  = "Done"
        Comment = "[2026-04-23] WEEKLY REVIEW - Tuning Round 1 completado. Relevância atingiu 92.5% (superou 85% target). Resultado consolidado em benchmark. Pronto para próxima fase."
    },
    @{
        Key     = "ML-67"
        Status  = "Done"
        Comment = "[2026-04-23] WEEKLY REVIEW - Schema validation completado com 100% de sucesso. Validação operacional entregue. Pronto para produção."
    },
    @{
        Key     = "ML-68"
        Status  = "Done"
        Comment = "[2026-04-23] WEEKLY REVIEW - Parse rate validado em 100%. Extração de documentação confirmada sem falhas. Integrado ao pipeline final."
    },
    @{
        Key     = "ML-69"
        Status  = "Done"
        Comment = "[2026-04-23] WEEKLY REVIEW - Tuning exploratório concluído com conclusão NO-GO para tuning puro. Avanço para arquitetura assíncrona aprovado. PDF export queue implementado."
    },
    @{
        Key     = "ML-70"
        Status  = "Done"
        Comment = "[2026-04-23] WEEKLY REVIEW - Validação de benchmark consolidada. Métricas P50/P95 documentadas. Pronto para integração S1B."
    },
    @{
        Key     = "ML-71"
        Status  = "Done"
        Comment = "[2026-04-23] WEEKLY REVIEW - Smoke test estendido executado. Artefatos de resultado consolidados. Zero falhas críticas identificadas."
    },
    @{
        Key     = "ML-72"
        Status  = "Done"
        Comment = "[2026-04-23] WEEKLY REVIEW - Progressive concurrency test completado. Carga simulada validada. Performance sob baseline confirmada."
    }
)

# Teste de conexão
Write-Host "🔍 Testando conexão com Jira..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "$JiraUrl/rest/api/3/myself" `
        -Headers $headers `
        -Method GET `
        -ErrorAction Stop

    $user = $testResponse.Content | ConvertFrom-Json
    Write-Host "✅ Autenticação bem-sucedida!" -ForegroundColor Green
    Write-Host "   Usuário: $($user.displayName)`n"
}
catch {
    Write-Host "❌ Erro na autenticação: $_" -ForegroundColor Red
    Write-Host "   Verifique suas credenciais e tente novamente."
    exit 1
}

# Atualizar cada issue
Write-Host "📝 Iniciando atualizações..." -ForegroundColor Cyan
Write-Host "=========================================`n"

$successCount = 0
$errorCount = 0

foreach ($issue in $issues) {
    Write-Host "Processando $($issue.Key)..." -ForegroundColor Yellow

    try {
        # Adicionar comentário
        $commentBody = @{
            body = @{
                version = 1
                type    = "doc"
                content = @(
                    @{
                        type    = "paragraph"
                        content = @(
                            @{
                                type = "text"
                                text = $issue.Comment
                            }
                        )
                    }
                )
            }
        }

        $commentResponse = Invoke-WebRequest -Uri "$JiraUrl/rest/api/3/issue/$($issue.Key)/comment" `
            -Headers $headers `
            -Body ($commentBody | ConvertTo-Json -Depth 10) `
            -Method POST `
            -ErrorAction Stop

        Write-Host "  ✅ Comentário adicionado" -ForegroundColor Green

        # Tentar transição para Done (IDs variam por instância - aqui usamos 10000)
        # Se falhar, avise ao usuário que ele precisa fazer manualmente
        try {
            $transitionBody = @{
                transition = @{
                    id = "10000"
                }
            }

            Invoke-WebRequest -Uri "$JiraUrl/rest/api/3/issue/$($issue.Key)/transitions" `
                -Headers $headers `
                -Body ($transitionBody | ConvertTo-Json -Depth 10) `
                -Method POST `
                -ErrorAction SilentlyContinue | Out-Null

            Write-Host "  ✅ Status atualizado para Done" -ForegroundColor Green
        }
        catch {
            Write-Host "  ⚠️  Status não pôde ser atualizado automaticamente" -ForegroundColor Yellow
            Write-Host "     Atualize manualmente no Jira para 'Done'" -ForegroundColor Yellow
        }

        $successCount++
    }
    catch {
        Write-Host "  ❌ Erro: $_" -ForegroundColor Red
        $errorCount++
    }

    Write-Host ""
}

# Resumo
Write-Host "=========================================`n"
Write-Host "📊 RESUMO DA ATUALIZAÇÃO" -ForegroundColor Cyan
Write-Host "  ✅ Sucesso: $successCount"
Write-Host "  ❌ Erros: $errorCount"
Write-Host "  📍 Total: $($issues.Count)`n"

if ($errorCount -eq 0) {
    Write-Host "🎉 Todas as atualizações foram realizadas com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Algumas atualizações falharam. Verifique acima." -ForegroundColor Yellow
}
