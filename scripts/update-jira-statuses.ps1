param(
    [Parameter(Mandatory = $false)]
    [string]$JiraBaseUrl,

    [Parameter(Mandatory = $false)]
    [string]$JiraEmail,

    [Parameter(Mandatory = $false)]
    [string]$JiraApiToken,

    [Parameter(Mandatory = $true)]
    [string]$ProjectKey,

    [Parameter(Mandatory = $true)]
    [string]$CsvPath,

    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-ConfigValue {
    param(
        [string]$ExplicitValue,
        [string]$EnvName,
        [string]$DisplayName
    )

    if (-not [string]::IsNullOrWhiteSpace($ExplicitValue)) {
        return $ExplicitValue
    }

    $fromEnv = [Environment]::GetEnvironmentVariable($EnvName)
    if (-not [string]::IsNullOrWhiteSpace($fromEnv)) {
        return $fromEnv
    }

    throw "$DisplayName nao informado. Passe o parametro -$DisplayName ou defina a variavel de ambiente $EnvName."
}

function Normalize-JiraBaseUrl {
    param(
        [string]$BaseUrl
    )

    $trimmed = $BaseUrl.Trim().TrimEnd('/')
    if ($trimmed -match '^(https?://[^/]+)') {
        return $Matches[1]
    }

    return $trimmed
}

function Get-BasicHeaders {
    param(
        [string]$Email,
        [string]$Token
    )

    $authRaw = "$Email`:$Token"
    $authBytes = [System.Text.Encoding]::ASCII.GetBytes($authRaw)
    $authValue = [Convert]::ToBase64String($authBytes)

    return @{
        Authorization = "Basic $authValue"
        Accept        = 'application/json'
    }
}

function Get-TransitionId {
    param(
        [string]$BaseUrl,
        [hashtable]$Headers,
        [string]$IssueKey,
        [string]$TargetStatus
    )

    $uri = "$BaseUrl/rest/api/2/issue/$IssueKey/transitions"
    $response = Invoke-RestMethod -Method Get -Uri $uri -Headers $Headers

    foreach ($transition in $response.transitions) {
        if ($transition.name -ieq $TargetStatus) {
            return [string]$transition.id
        }
    }

    return $null
}

function Invoke-TransitionIssue {
    param(
        [string]$BaseUrl,
        [hashtable]$Headers,
        [string]$IssueKey,
        [string]$TransitionId
    )

    $uri = "$BaseUrl/rest/api/2/issue/$IssueKey/transitions"
    $body = @{ transition = @{ id = $TransitionId } } | ConvertTo-Json -Depth 10
    Invoke-RestMethod -Method Post -Uri $uri -Headers $Headers -ContentType 'application/json' -Body $body
}

function Add-JiraComment {
    param(
        [string]$BaseUrl,
        [hashtable]$Headers,
        [string]$IssueKey,
        [string]$Comment
    )

    $uri = "$BaseUrl/rest/api/2/issue/$IssueKey/comment"
    $body = @{ body = $Comment } | ConvertTo-Json -Depth 10
    Invoke-RestMethod -Method Post -Uri $uri -Headers $Headers -ContentType 'application/json' -Body $body
}

$JiraBaseUrl = Resolve-ConfigValue -ExplicitValue $JiraBaseUrl -EnvName 'JIRA_BASE_URL' -DisplayName 'JiraBaseUrl'
$JiraEmail = Resolve-ConfigValue -ExplicitValue $JiraEmail -EnvName 'JIRA_EMAIL' -DisplayName 'JiraEmail'
$JiraApiToken = Resolve-ConfigValue -ExplicitValue $JiraApiToken -EnvName 'JIRA_API_TOKEN' -DisplayName 'JiraApiToken'

$JiraBaseUrl = Normalize-JiraBaseUrl -BaseUrl $JiraBaseUrl
$headers = Get-BasicHeaders -Email $JiraEmail -Token $JiraApiToken

if (-not (Test-Path -LiteralPath $CsvPath)) {
    throw "CSV nao encontrado: $CsvPath"
}

$rows = Import-Csv -LiteralPath $CsvPath
if ($rows.Count -eq 0) {
    throw 'CSV vazio.'
}

foreach ($row in $rows) {
    $issueKey = $row.JiraKey
    $targetStatus = $row.'Suggested Status'
    $comment = $row.Comment

    if ([string]::IsNullOrWhiteSpace($issueKey) -or [string]::IsNullOrWhiteSpace($targetStatus)) {
        continue
    }

    Write-Host "Processando $issueKey -> $targetStatus"

    if ($DryRun) {
        Write-Host "[DRY-RUN] Transicao e comentario nao executados."
        continue
    }

    $transitionId = Get-TransitionId -BaseUrl $JiraBaseUrl -Headers $headers -IssueKey $issueKey -TargetStatus $targetStatus
    if ($null -eq $transitionId) {
        Write-Host "[WARN] Nenhuma transicao encontrada para status '$targetStatus' em $issueKey"
    }
    else {
        Invoke-TransitionIssue -BaseUrl $JiraBaseUrl -Headers $headers -IssueKey $issueKey -TransitionId $transitionId
        Write-Host "[OK] Status atualizado para $targetStatus"
    }

    if (-not [string]::IsNullOrWhiteSpace($comment)) {
        Add-JiraComment -BaseUrl $JiraBaseUrl -Headers $headers -IssueKey $issueKey -Comment $comment
        Write-Host "[OK] Comentario adicionado"
    }
}
