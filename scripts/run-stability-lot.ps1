param(
    [string]$ApiUrl = "http://localhost:3000",
    [int]$ProjectId = 7,
    [ValidateSet('r6','r7','custom')]
    [string]$Label = 'custom',
    [ValidateRange(1, 200)]
    [int]$SampleSize = 5,
    [ValidateRange(30, 3600)]
    [int]$MaxObserveSeconds = 240,
    [string]$OutputPath = "",
    [ValidateRange(2, 60)]
    [int]$PollIntervalSeconds = 8,
    [ValidateRange(100, 5000)]
    [int]$TriggerDelayMs = 350,
    [ValidateRange(3, 120)]
    [int]$RequestTimeoutSeconds = 20,
    [ValidateRange(1, 6)]
    [int]$MaxRequestRetries = 3
)

$ErrorActionPreference = 'Stop'

function Invoke-ApiWithRetry {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('GET', 'POST')]
        [string]$Method,

        [Parameter(Mandatory = $true)]
        [string]$Uri,

        [string]$Body = $null,

        [int]$TimeoutSec = 20,

        [int]$Retries = 3
    )

    $lastError = $null
    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        try {
            if ($Method -eq 'POST') {
                return Invoke-RestMethod -Uri $Uri -Method Post -Headers @{ 'Content-Type' = 'application/json' } -Body $Body -TimeoutSec $TimeoutSec
            }

            return Invoke-RestMethod -Uri $Uri -Method Get -TimeoutSec $TimeoutSec
        }
        catch {
            $lastError = $_
            if ($attempt -lt $Retries) {
                Start-Sleep -Seconds ([Math]::Min($attempt, 3))
            }
        }
    }

    throw $lastError
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path (Get-Location) ("maker-connect/docs/d10-t2-smoke-extended-result-" + $Label + ".json")
}

$outputDir = Split-Path -Parent $OutputPath
if (-not [string]::IsNullOrWhiteSpace($outputDir) -and -not (Test-Path $outputDir)) {
    New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

$triggered = @()
$triggerFailures = @()
$pollFailures = 0

for ($i = 1; $i -le $SampleSize; $i++) {
    try {
        $body = @{ input = "D10 rerun $Label $(Get-Date -Format s) - execucao $i - janela ${MaxObserveSeconds}s"; source = 'manual' } | ConvertTo-Json
        $resp = Invoke-ApiWithRetry -Method 'POST' -Uri "$ApiUrl/api/projects/$ProjectId/extract" -Body $body -TimeoutSec $RequestTimeoutSeconds -Retries $MaxRequestRetries
        if ($null -eq $resp -or $null -eq $resp.data -or $null -eq $resp.data.logId) {
            throw "Trigger response sem data.logId para execucao $i."
        }

        $triggered += [int]$resp.data.logId
    }
    catch {
        $triggerFailures += [pscustomobject]@{
            execution = $i
            error = $_.Exception.Message
        }
    }

    Start-Sleep -Milliseconds $TriggerDelayMs
}

$deadline = (Get-Date).AddSeconds($MaxObserveSeconds)
$last = @()

do {
    try {
        $logs = (Invoke-ApiWithRetry -Method 'GET' -Uri "$ApiUrl/api/projects/$ProjectId/extract" -TimeoutSec $RequestTimeoutSeconds -Retries $MaxRequestRetries).data
    }
    catch {
        $pollFailures++
        Start-Sleep -Seconds $PollIntervalSeconds
        continue
    }

    if ($null -eq $logs) {
        Start-Sleep -Seconds $PollIntervalSeconds
        continue
    }

    $lookup = @{}
    foreach ($l in $logs) { $lookup[[int]$l.id] = $l }

    $snap = @()
    foreach ($id in $triggered) {
        if ($lookup.ContainsKey($id)) {
            $l = $lookup[$id]
            $snap += [pscustomobject]@{
                id = $l.id
                status = $l.status
                latencyMs = $l.latencyMs
                n8nExecutionId = $l.n8nExecutionId
                updatedAt = $l.updatedAt
            }
        }
    }

    $last = $snap

    $expected = $triggered.Count
    $allTerminal = ($expected -gt 0) -and ($snap.Count -eq $expected) -and (($snap | Where-Object { $_.status -in @('queued', 'processing') }).Count -eq 0)
    if ($allTerminal) { break }

    Start-Sleep -Seconds $PollIntervalSeconds
} while ((Get-Date) -lt $deadline)

$done = ($last | Where-Object { $_.status -eq 'done' }).Count
$queued = ($last | Where-Object { $_.status -eq 'queued' }).Count
$processing = ($last | Where-Object { $_.status -eq 'processing' }).Count
$failed = ($last | Where-Object { $_.status -eq 'failed' }).Count
$triggeredCount = $triggered.Count
$missing = [Math]::Max($triggeredCount - $last.Count, 0)
$allDone = ($triggeredCount -gt 0) -and ($done -eq $triggeredCount) -and ($queued -eq 0) -and ($processing -eq 0) -and ($failed -eq 0) -and ($missing -eq 0)

$finalStatus = 'partial'
if ($allDone -and $triggerFailures.Count -eq 0) {
    $finalStatus = 'passed'
}
elseif (($triggeredCount -eq 0) -or ($done -eq 0 -and $failed -eq 0 -and $missing -gt 0)) {
    $finalStatus = 'failed'
}

$result = [pscustomobject]@{
    generatedAt = (Get-Date).ToString('o')
    lotLabel = $Label
    observePolicy = @{
        maxObserveSeconds = $MaxObserveSeconds
        pollIntervalSeconds = $PollIntervalSeconds
        requestTimeoutSeconds = $RequestTimeoutSeconds
        maxRequestRetries = $MaxRequestRetries
    }
    sampleSizeRequested = $SampleSize
    triggeredCount = $triggeredCount
    triggerFailureCount = $triggerFailures.Count
    pollFailureCount = $pollFailures
    missing = $missing
    total = $SampleSize
    done = $done
    queued = $queued
    processing = $processing
    failed = $failed
    allDone = $allDone
    finalStatus = $finalStatus
    triggerFailures = $triggerFailures
    observations = $last
}

$result | ConvertTo-Json -Depth 8 | Set-Content -Path $OutputPath -Encoding UTF8 -Force
$result | ConvertTo-Json -Depth 8
