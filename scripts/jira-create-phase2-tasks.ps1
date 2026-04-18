$ErrorActionPreference = 'Stop'

$base = 'https://catolicasc-team-ra944io4.atlassian.net'
$email = 'vinicius.froes@catolicasc.edu.br'
$token = 'ATATT3xFfGF0iT9MHSbK355lzKI_1i4duk6yAloAHGmA5ab-L1x016PLPJvMRnlPw72eRUZzwlbDV-J5CQTjC4ZKxEUg1-FluJyed_uDIkeUHLIC7iK0OnnVhddP5EDa6wbluzRxUDJN-iDEKlFrmtEOCiU_tNyhs7RqLTyRfQlhM0Ns5kiRSzM=5518766E'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${email}:$token"))
$headers = @{ Authorization = "Basic $auth"; Accept = 'application/json'; 'Content-Type' = 'application/json' }

function New-TaskUnderEpic([string]$summary, [string]$desc) {
    $body = @{
        fields = @{
            project = @{ key = 'ML' }
            summary = $summary
            issuetype = @{ name = 'Tarefa' }
            parent = @{ key = 'ML-64' }
            description = @{
                type = 'doc'
                version = 1
                content = @(
                    @{
                        type = 'paragraph'
                        content = @(
                            @{
                                type = 'text'
                                text = $desc
                            }
                        )
                    }
                )
            }
        }
    } | ConvertTo-Json -Depth 20

    $res = Invoke-RestMethod -Uri "$base/rest/api/3/issue" -Headers $headers -Method Post -Body $body
    return $res.key
}

$k1 = New-TaskUnderEpic '[PHASE2] Prompt & Output Schema Tuning' 'Objective: increase relevance with stricter system prompt and normalized JSON schema. Acceptance: parse >=95%; measurable relevance uplift vs baseline.'
$k2 = New-TaskUnderEpic '[PHASE2] Retrieval & Context Budget Optimization' 'Objective: improve retrieval precision (top-k, chunking, context pruning). Acceptance: relevance >=70% intermediate target and lower token/context overhead.'
$k3 = New-TaskUnderEpic '[PHASE2] Ollama Runtime Performance Optimization' 'Objective: reduce end-to-end latency by tuning runtime params and warmup strategy. Acceptance: p50 <=45s intermediate target and p95 <=70s on 10-run lot.'
$k4 = New-TaskUnderEpic '[PHASE2] Benchmark Harness & KPI Validation Reruns' 'Objective: run controlled benchmark rounds and publish canonical reports. Acceptance: reproducible report with p50/p95/relevance/parse and pass/fail decision.'

foreach ($k in @($k1, $k2, $k3, $k4)) {
    $linkBody = @{
        type = @{ name = 'Blocks' }
        outwardIssue = @{ key = 'ML-65' }
        inwardIssue = @{ key = $k }
    } | ConvertTo-Json -Depth 10

    Invoke-RestMethod -Uri "$base/rest/api/3/issueLink" -Headers $headers -Method Post -Body $linkBody | Out-Null
}

$url = "$base/rest/api/3/search/jql?jql=parent%20%3D%20ML-64%20ORDER%20BY%20created%20DESC&maxResults=20&fields=summary,status,issuetype,parent"
$res = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
$res.issues |
    Select-Object key, @{ n = 'status'; e = { $_.fields.status.name } }, @{ n = 'summary'; e = { $_.fields.summary } } |
    Format-Table -AutoSize

Write-Host "CREATED: $k1,$k2,$k3,$k4"
