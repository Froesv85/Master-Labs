param(
    [Parameter(Mandatory = $true)]
    [string]$JiraBaseUrl,

    [Parameter(Mandatory = $true)]
    [string]$ProjectKey,

    [Parameter(Mandatory = $true)]
    [string]$JiraEmail,

    [Parameter(Mandatory = $true)]
    [string]$JiraApiToken,

    [string]$CsvPath = ".github/templates/jira-import.template.csv",

    [string]$EpicNameField = "customfield_10011",

    [string]$EpicLinkField = "customfield_10014",

    [string]$StoryPointsField,

    [string]$OutputMapPath = "docs/jira-import-result.json",

    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-FieldValue {
    param(
        [Parameter(Mandatory = $true)]
        [psobject]$Row,
        [Parameter(Mandatory = $true)]
        [string[]]$CandidateNames
    )

    foreach ($name in $CandidateNames) {
        $prop = $Row.PSObject.Properties | Where-Object { $_.Name -eq $name }
        if ($null -ne $prop -and -not [string]::IsNullOrWhiteSpace([string]$prop.Value)) {
            return [string]$prop.Value
        }
    }

    return ""
}

function Get-MultiColumns {
    param(
        [Parameter(Mandatory = $true)]
        [psobject]$Row,
        [Parameter(Mandatory = $true)]
        [string]$Prefix
    )

    $values = @()
    foreach ($prop in $Row.PSObject.Properties) {
        if ($prop.Name -like "$Prefix*") {
            $raw = [string]$prop.Value
            if (-not [string]::IsNullOrWhiteSpace($raw)) {
                $raw -split "[;,|]" | ForEach-Object {
                    $value = $_.Trim()
                    if (-not [string]::IsNullOrWhiteSpace($value)) {
                        $values += $value
                    }
                }
            }
        }
    }

    return @($values | Select-Object -Unique)
}

function Build-Description {
    param(
        [Parameter(Mandatory = $true)]
        [psobject]$Row
    )

    $description = Get-FieldValue -Row $Row -CandidateNames @("Description")
    $acceptance = Get-FieldValue -Row $Row -CandidateNames @("Acceptance Criteria")

    if ([string]::IsNullOrWhiteSpace($acceptance)) {
        return $description
    }

    $criteriaLines = @()
    $acceptance -split ";" | ForEach-Object {
        $c = $_.Trim()
        if (-not [string]::IsNullOrWhiteSpace($c)) {
            $criteriaLines += "- $c"
        }
    }

    $criteriaBlock = ($criteriaLines -join "`n")

    if ([string]::IsNullOrWhiteSpace($description)) {
        return "Acceptance Criteria`n$criteriaBlock"
    }

    return "$description`n`nAcceptance Criteria`n$criteriaBlock"
}

function New-IssuePayload {
    param(
        [Parameter(Mandatory = $true)]
        [psobject]$Row,
        [Parameter(Mandatory = $true)]
        [string]$Project,
        [Parameter(Mandatory = $false)]
        [string]$ParentIssueKey,
        [Parameter(Mandatory = $false)]
        [string]$ParentIssueType,
        [Parameter(Mandatory = $true)]
        [string]$EpicNameFieldId,
        [Parameter(Mandatory = $true)]
        [string]$EpicLinkFieldId,
        [Parameter(Mandatory = $false)]
        [string]$StoryPointsFieldId
    )

    $issueType = Get-FieldValue -Row $Row -CandidateNames @("Issue Type")
    $summary = Get-FieldValue -Row $Row -CandidateNames @("Summary")
    $priority = Get-FieldValue -Row $Row -CandidateNames @("Priority")

    if ([string]::IsNullOrWhiteSpace($issueType)) {
        throw "Issue Type vazio para Summary '$summary'."
    }
    if ([string]::IsNullOrWhiteSpace($summary)) {
        throw "Summary vazio para um item do CSV."
    }

    $fields = @{
        project   = @{ key = $Project }
        issuetype = @{ name = $issueType }
        summary   = $summary
    }

    $description = Build-Description -Row $Row
    if (-not [string]::IsNullOrWhiteSpace($description)) {
        $fields.description = $description
    }

    if (-not [string]::IsNullOrWhiteSpace($priority)) {
        $fields.priority = @{ name = $priority }
    }

    $labels = Get-MultiColumns -Row $Row -Prefix "Labels"
    $labelsList = @($labels)
    if ($labelsList.Count -gt 0) {
        $fields.labels = $labelsList
    }

    $components = Get-MultiColumns -Row $Row -Prefix "Component"
    $componentsList = @($components)
    if ($componentsList.Count -gt 0) {
        $fields.components = @()
        foreach ($component in $componentsList) {
            $fields.components += @{ name = $component }
        }
    }

    $storyPointsRaw = Get-FieldValue -Row $Row -CandidateNames @("Story Points")
    if (-not [string]::IsNullOrWhiteSpace($StoryPointsFieldId) -and -not [string]::IsNullOrWhiteSpace($storyPointsRaw)) {
        [double]$sp = 0
        if ([double]::TryParse($storyPointsRaw, [ref]$sp)) {
            $fields[$StoryPointsFieldId] = $sp
        }
    }

    $isSubTask = $issueType -ieq "Sub-task"
    $isEpic = $issueType -ieq "Epic"

    # REMOVED: Epic Name field causes issues when configured as array in some Jira instances
    # Summary field is sufficient for epic identification

    if (-not [string]::IsNullOrWhiteSpace($ParentIssueKey)) {
        if ($isSubTask) {
            $fields.parent = @{ key = $ParentIssueKey }
        }
        # REMOVED: Epic Link field causes issues when configured as array in some Jira instances
        # Links will need to be created manually post-import
    }

    return @{ fields = $fields }
}

function Invoke-JiraCreateIssue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [hashtable]$Headers,
        [Parameter(Mandatory = $true)]
        [hashtable]$Payload
    )

    $uri = "$BaseUrl/rest/api/2/issue"
    $body = $Payload | ConvertTo-Json -Depth 20

    return Invoke-RestMethod -Method Post -Uri $uri -Headers $Headers -ContentType "application/json" -Body $body
}

$JiraBaseUrl = $JiraBaseUrl.TrimEnd("/")

if (-not (Test-Path -LiteralPath $CsvPath)) {
    throw "CSV nao encontrado: $CsvPath"
}

$authRaw = "$JiraEmail`:$JiraApiToken"
$authBytes = [System.Text.Encoding]::ASCII.GetBytes($authRaw)
$authValue = [Convert]::ToBase64String($authBytes)
$headers = @{
    Authorization = "Basic $authValue"
    Accept        = "application/json"
}

$allLines = Get-Content -LiteralPath $CsvPath
if ($allLines.Count -lt 2) {
    throw "CSV sem dados: $CsvPath"
}

$rawHeaders = $allLines[0].Split(",")
$headerCounter = @{}
$uniqueHeaders = @()

foreach ($rawHeader in $rawHeaders) {
    $h = $rawHeader.Trim()
    if (-not $headerCounter.ContainsKey($h)) {
        $headerCounter[$h] = 0
        $uniqueHeaders += $h
    }
    else {
        $headerCounter[$h] = [int]$headerCounter[$h] + 1
        $uniqueHeaders += "${h}_$($headerCounter[$h])"
    }
}

$csvBody = $allLines | Select-Object -Skip 1
$rows = $csvBody | ConvertFrom-Csv -Header $uniqueHeaders
if ($rows.Count -eq 0) {
    throw "CSV vazio: $CsvPath"
}

$workItemToKey = @{}
$workItemToType = @{}
$importResult = @()

$pending = New-Object System.Collections.Generic.List[object]
foreach ($row in $rows) {
    [void]$pending.Add($row)
}

$createdCount = 0
$dryCounter = 0

while ($pending.Count -gt 0) {
    $createdInPass = 0

    for ($i = $pending.Count - 1; $i -ge 0; $i--) {
        $row = $pending[$i]

        $workItemId = Get-FieldValue -Row $row -CandidateNames @("Work Item ID")
        $parentWorkItemId = Get-FieldValue -Row $row -CandidateNames @("Parent")
        $issueType = Get-FieldValue -Row $row -CandidateNames @("Issue Type")
        $summary = Get-FieldValue -Row $row -CandidateNames @("Summary")

        $parentIssueKey = ""
        $parentIssueType = ""
        if (-not [string]::IsNullOrWhiteSpace($parentWorkItemId)) {
            if (-not $workItemToKey.ContainsKey($parentWorkItemId)) {
                continue
            }
            $parentIssueKey = [string]$workItemToKey[$parentWorkItemId]
            $parentIssueType = [string]$workItemToType[$parentWorkItemId]
        }

        $payloadParams = @{
            Row               = $row
            Project           = $ProjectKey
            ParentIssueKey    = $parentIssueKey
            ParentIssueType   = $parentIssueType
            EpicNameFieldId   = $EpicNameField
            EpicLinkFieldId   = $EpicLinkField
            StoryPointsFieldId = $StoryPointsField
        }

        $payload = New-IssuePayload @payloadParams

        if ($DryRun) {
            $dryCounter++
            $issueKey = "DRY-$dryCounter"
            Write-Host "[DRY-RUN] Criaria ${issueType}: $summary -> $issueKey"
        }
        else {
            try {
                $response = Invoke-JiraCreateIssue -BaseUrl $JiraBaseUrl -Headers $headers -Payload $payload
                $issueKey = [string]$response.key
                Write-Host "[OK] Criado ${issueType}: $summary -> $issueKey"
            }
            catch {
                $errorMessage = $_.Exception.Message
                Write-Host "[ERRO] Falha ao criar '$summary' ($issueType)."
                Write-Host "Detalhe: $errorMessage"
                throw
            }
        }

        if (-not [string]::IsNullOrWhiteSpace($workItemId)) {
            $workItemToKey[$workItemId] = $issueKey
            $workItemToType[$workItemId] = $issueType
        }

        $importResult += [pscustomobject]@{
            WorkItemId       = $workItemId
            JiraKey          = $issueKey
            IssueType        = $issueType
            Summary          = $summary
            ParentWorkItemId = $parentWorkItemId
            ParentJiraKey    = $parentIssueKey
        }

        $pending.RemoveAt($i)
        $createdInPass++
        $createdCount++
    }

    if ($createdInPass -eq 0) {
        Write-Host "[ERRO] Nao foi possivel resolver dependencias de parent para os itens restantes."
        foreach ($r in $pending) {
            $wid = Get-FieldValue -Row $r -CandidateNames @("Work Item ID")
            $pid = Get-FieldValue -Row $r -CandidateNames @("Parent")
            $sum = Get-FieldValue -Row $r -CandidateNames @("Summary")
            Write-Host "- WorkItemID=$wid Parent=$pid Summary=$sum"
        }
        throw "Import interrompido por dependencias invalidas de parent."
    }
}

$outputDir = Split-Path -Parent $OutputMapPath
if (-not [string]::IsNullOrWhiteSpace($outputDir) -and -not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$importResult | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputMapPath -Encoding UTF8

Write-Host ""
Write-Host "Import finalizado. Itens processados: $createdCount"
Write-Host "Mapa de chaves salvo em: $OutputMapPath"
