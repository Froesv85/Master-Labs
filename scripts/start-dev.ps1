param(
    [switch]$Install
)

# Start backend and frontend development servers on Windows (PowerShell).
# Usage: .\scripts\start-dev.ps1            # starts both (assumes deps installed)
#        .\scripts\start-dev.ps1 -Install  # runs npm install before starting

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")

$frontendPath = Join-Path $repoRoot 'maker-connect'
$backendPath = Join-Path $frontendPath 'backend'

Write-Host "Starting MakerConnect dev: backend -> $backendPath, frontend -> $frontendPath"

if ($Install) {
    Write-Host "Installing dependencies (backend)..."
    Push-Location $backendPath
    npm install
    Pop-Location

    Write-Host "Installing dependencies (frontend)..."
    Push-Location $frontendPath
    npm install
    Pop-Location
}

Write-Host "Launching backend in a new PowerShell window..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$backendPath'; npm run dev"

Start-Sleep -Milliseconds 500

Write-Host "Launching frontend in a new PowerShell window..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$frontendPath'; npm run dev"

Write-Host "Both processes started. Use the new windows to view logs."
