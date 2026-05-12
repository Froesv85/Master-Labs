# Checks whether ollama CLI is installed, whether a process is running,
# and whether the local API responds at localhost:11434/v1/models

$installed = $false
try {
    & ollama --version > $null 2>&1
    if ($LASTEXITCODE -eq 0) { $installed = $true }
} catch {
    $installed = $false
}

if ($installed) { Write-Output "OLLAMA_INSTALLED" } else { Write-Output "OLLAMA_NOT_INSTALLED" }

if (Get-Process -Name ollama -ErrorAction SilentlyContinue) {
    Write-Output "PROCESS:RUNNING"
} else {
    Write-Output "PROCESS:NOTFOUND"
}

try {
    Invoke-RestMethod -Uri 'http://127.0.0.1:11434/v1/models' -TimeoutSec 3 | Out-Null
    Write-Output "API:OK"
} catch {
    Write-Output "API:DOWN"
}
