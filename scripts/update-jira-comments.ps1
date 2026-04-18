param(
    [string]$JiraBaseUrl = "https://catolicasc-team-ra944io4.atlassian.net",
    [string]$JiraEmail = "vinicius.froes@catolicasc.edu.br",
    [string]$JiraApiToken,
    [string]$IssueKey,
    [string]$Comment
)

if (-not $JiraApiToken) {
    Write-Error "JiraApiToken é obrigatório"
    exit 1
}

if (-not $IssueKey) {
    Write-Error "IssueKey é obrigatório (ex: ML-56)"
    exit 1
}

if (-not $Comment) {
    Write-Error "Comment é obrigatório"
    exit 1
}

# Prepare auth
$authHeader = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$JiraEmail`:$JiraApiToken"))

# Add comment to issue
$addCommentUrl = "$JiraBaseUrl/rest/api/3/issue/$IssueKey/comments"

$headers = @{
    "Authorization" = "Basic $authHeader"
    "Content-Type"  = "application/json"
}

$body = @{
    "body" = @{
        "type"    = "doc"
        "version" = 1
        "content" = @(
            @{
                "type"  = "paragraph"
                "content" = @(
                    @{
                        "type" = "text"
                        "text" = $Comment
                    }
                )
            }
        )
    }
} | ConvertTo-Json -Depth 5

Write-Host "Adding comment to $IssueKey..."
Write-Host "URL: $addCommentUrl"

try {
    $response = Invoke-RestMethod -Uri $addCommentUrl -Method Post -Headers $headers -Body $body
    Write-Host "✅ Comment added successfully to $IssueKey"
    Write-Host "Comment ID: $($response.id)"
    return $response
} catch {
    Write-Error "Failed to add comment: $_"
    exit 1
}
