$ErrorActionPreference = 'Stop'

$base = 'https://catolicasc-team-ra944io4.atlassian.net'
$email = 'vinicius.froes@catolicasc.edu.br'
$token = 'ATATT3xFfGF0iT9MHSbK355lzKI_1i4duk6yAloAHGmA5ab-L1x016PLPJvMRnlPw72eRUZzwlbDV-J5CQTjC4ZKxEUg1-FluJyed_uDIkeUHLIC7iK0OnnVhddP5EDa6wbluzRxUDJN-iDEKlFrmtEOCiU_tNyhs7RqLTyRfQlhM0Ns5kiRSzM=5518766E'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${email}:$token"))
$headers = @{ Authorization = "Basic $auth"; Accept = 'application/json'; 'Content-Type' = 'application/json' }

function Transition-Issue([string]$key, [string]$transitionId) {
    $body = @{ transition = @{ id = $transitionId } } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "$base/rest/api/3/issue/$key/transitions" -Headers $headers -Method Post -Body $body | Out-Null
}

# 1) ML-56 -> Done
Transition-Issue -key 'ML-56' -transitionId '4'
Write-Host 'ML-56 moved to Done.'

# 2) Create Phase 2 Epic
$epicDesc = @'
Phase 2 Epic focused on LLM optimization for MakerConnect.
Scope:
- Latency optimization (P50/P95)
- Relevance tuning (RAG + prompts)
- Benchmark reruns and validation
Acceptance goals:
- P50 < 15s
- P95 < 15s
- Relevance >= 85%
- Parse success >= 95%
'@

$epicBody = @{
    fields = @{
        project = @{ key = 'ML' }
        summary = '[EPIC] Phase 2 - LLM Latency & Relevance Tuning'
        issuetype = @{ name = 'Epic' }
        description = @{
            type = 'doc'
            version = 1
            content = @(
                @{
                    type = 'paragraph'
                    content = @(
                        @{
                            type = 'text'
                            text = $epicDesc
                        }
                    )
                }
            )
        }
    }
} | ConvertTo-Json -Depth 20

$epicRes = Invoke-RestMethod -Uri "$base/rest/api/3/issue" -Headers $headers -Method Post -Body $epicBody
$epicKey = $epicRes.key
Write-Host "Epic created: $epicKey"

# 3) Create blocker issue for ML-57
$blockDesc = @'
Blocking issue for ML-57.
Reason: Benchmark KPIs not met after stability fix.
Current gaps:
- Latency P50/P95 above target
- Relevance below target
Required work:
- Prompt tuning
- Embedding/retrieval tuning
- Model/runtime optimization
- Controlled benchmark reruns
'@

$blockBody = @{
    fields = @{
        project = @{ key = 'ML' }
        summary = '[BLOCKER] Requires LLM Optimization (Phase 2)'
        issuetype = @{ name = 'Task' }
        description = @{
            type = 'doc'
            version = 1
            content = @(
                @{
                    type = 'paragraph'
                    content = @(
                        @{
                            type = 'text'
                            text = $blockDesc
                        }
                    )
                }
            )
        }
    }
} | ConvertTo-Json -Depth 20

$blockRes = Invoke-RestMethod -Uri "$base/rest/api/3/issue" -Headers $headers -Method Post -Body $blockBody
$blockKey = $blockRes.key
Write-Host "Blocker created: $blockKey"

# 4) Link blocker -> ML-57 (Blocks)
$linkBody = @{
    type = @{ name = 'Blocks' }
    inwardIssue = @{ key = 'ML-57' }
    outwardIssue = @{ key = $blockKey }
    comment = @{
        body = @{
            type = 'doc'
            version = 1
            content = @(
                @{
                    type = 'paragraph'
                    content = @(
                        @{
                            type = 'text'
                            text = "Linked blocker $blockKey to ML-57 as Blocks."
                        }
                    )
                }
            )
        }
    }
} | ConvertTo-Json -Depth 20

Invoke-RestMethod -Uri "$base/rest/api/3/issueLink" -Headers $headers -Method Post -Body $linkBody | Out-Null
Write-Host 'Issue link created (Blocks).'

# 5) ML-57 -> In Progress
Transition-Issue -key 'ML-57' -transitionId '3'
Write-Host 'ML-57 moved to In Progress.'

# 6) Add comment on ML-57
$commentText = "[BLOCKED] ML-57 depende do blocker $blockKey e do Epic $epicKey (Phase 2 LLM Optimization). Mantido em In Progress até atingir KPI alvo (P50/P95 < 15s; relevancia >= 85%)."
$commentBody = @{ body = $commentText } | ConvertTo-Json -Depth 5
$commentRes = Invoke-RestMethod -Uri "$base/rest/api/2/issue/ML-57/comment" -Headers $headers -Method Post -Body $commentBody

# 7) Final check
$url = "$base/rest/api/3/search/jql?jql=key%20in%20(ML-56,ML-57,$epicKey,$blockKey)&maxResults=10&fields=summary,status,issuetype"
$chk = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
$chk.issues |
    Select-Object key, @{ n = 'type'; e = { $_.fields.issuetype.name } }, @{ n = 'status'; e = { $_.fields.status.name } }, @{ n = 'summary'; e = { $_.fields.summary } } |
    Sort-Object key |
    Format-Table -AutoSize

Write-Host "RESULT: Epic=$epicKey | Blocker=$blockKey | CommentId=$($commentRes.id)"
