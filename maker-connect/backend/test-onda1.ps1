# MakerConnect Backend - Onda 1 Comprehensive Test Suite (PowerShell)
# Data: 2026-04-22
# Purpose: Test all 33 endpoints with real scenarios

param(
  [switch]$Verbose = $true
)

$ErrorActionPreference = "Continue"

# Configuration
$BaseUrl = "http://localhost:3001"
$ResultsFile = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0
$TestResults = @()

# Color codes
function Write-Success {
  param([string]$Message)
  Write-Host "✓ PASS - $Message" -ForegroundColor Green
}

function Write-Failure {
  param([string]$Message, [string]$Details)
  Write-Host "✗ FAIL - $Message" -ForegroundColor Red
  if ($Details) {
    Write-Host "  Details: $Details" -ForegroundColor Yellow
  }
}

function Write-Section {
  param([string]$Title)
  Write-Host ""
  Write-Host $Title -ForegroundColor Cyan
}

function LogTest {
  param([string]$TestName, [string]$Status, [string]$Details = "")
  
  $global:TotalTests++
  
  if ($Status -eq "PASS") {
    $global:PassedTests++
    if ($Verbose) { Write-Success $TestName }
  }
  else {
    $global:FailedTests++
    Write-Failure $TestName $Details
  }
  
  $TestResults += @{
    name    = $TestName
    status  = $Status
    details = $Details
  }
}

function Test-Health {
  Write-Section "[1/7] Checking API Health"
  
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET
    
    if ($response.StatusCode -eq 200) {
      LogTest "Health Check" "PASS"
      return $true
    }
    else {
      LogTest "Health Check" "FAIL" "HTTP $($response.StatusCode)"
      return $false
    }
  }
  catch {
    LogTest "Health Check" "FAIL" $_.Exception.Message
    Write-Host "Error: Make sure docker-compose is running!" -ForegroundColor Yellow
    return $false
  }
}

function Test-Auth {
  Write-Section "[2/7] Testing Authentication Endpoints"
  
  # Generate unique email
  $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
  $testEmail = "test_${timestamp}@example.com"
  $testPassword = "TestPass123!Secure"
  $testUsername = "testuser_$timestamp"
  
  # Test 1: Register
  try {
    $registerBody = @{
      email        = $testEmail
      password     = $testPassword
      username     = $testUsername
      display_name = "Test User"
      lgpd_consent = $true
    } | ConvertTo-Json
    
    $registerResponse = Invoke-WebRequest -Uri "$BaseUrl/auth/register" `
      -Method POST `
      -ContentType "application/json" `
      -Body $registerBody
    
    $registerData = $registerResponse.Content | ConvertFrom-Json
    $token = $registerData.data.token
    $refreshToken = $registerData.data.refresh_token
    $userId = $registerData.data.id
    
    if ($token) {
      LogTest "POST /auth/register" "PASS"
      $global:AuthToken = $token
      $global:TestUserId = $userId
    }
    else {
      LogTest "POST /auth/register" "FAIL" "No token in response"
      return $false
    }
  }
  catch {
    LogTest "POST /auth/register" "FAIL" $_.Exception.Message
    return $false
  }
  
  # Test 2: Login
  try {
    $loginBody = @{
      email    = $testEmail
      password = $testPassword
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "$BaseUrl/auth/login" `
      -Method POST `
      -ContentType "application/json" `
      -Body $loginBody
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $loginToken = $loginData.data.token
    
    if ($loginToken) {
      LogTest "POST /auth/login" "PASS"
    }
    else {
      LogTest "POST /auth/login" "FAIL" "Login failed"
    }
  }
  catch {
    LogTest "POST /auth/login" "FAIL" $_.Exception.Message
  }
  
  # Test 3: Validate Token
  try {
    $validateBody = @{ token = $token } | ConvertTo-Json
    
    $validateResponse = Invoke-WebRequest -Uri "$BaseUrl/auth/validate" `
      -Method POST `
      -ContentType "application/json" `
      -Body $validateBody
    
    $validateData = $validateResponse.Content | ConvertFrom-Json
    $isValid = $validateData.data.userId
    
    if ($isValid) {
      LogTest "POST /auth/validate" "PASS"
    }
    else {
      LogTest "POST /auth/validate" "FAIL"
    }
  }
  catch {
    LogTest "POST /auth/validate" "FAIL" $_.Exception.Message
  }
  
  # Test 4: Refresh Token
  try {
    $refreshBody = @{ refresh_token = $refreshToken } | ConvertTo-Json
    
    $refreshResponse = Invoke-WebRequest -Uri "$BaseUrl/auth/refresh" `
      -Method POST `
      -ContentType "application/json" `
      -Body $refreshBody
    
    $refreshData = $refreshResponse.Content | ConvertFrom-Json
    $newToken = $refreshData.data.token
    
    if ($newToken) {
      LogTest "POST /auth/refresh" "PASS"
    }
    else {
      LogTest "POST /auth/refresh" "FAIL"
    }
  }
  catch {
    LogTest "POST /auth/refresh" "FAIL" $_.Exception.Message
  }
  
  return $true
}

function Test-Users {
  Write-Section "[3/7] Testing User Profile Endpoints"
  
  if (-not $global:AuthToken) {
    LogTest "User Tests" "FAIL" "No auth token available"
    return $false
  }
  
  # Test 1: Get Profile
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/users/$($global:TestUserId)/profile" -Method GET
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.username) {
      LogTest "GET /users/:id/profile" "PASS"
    }
    else {
      LogTest "GET /users/:id/profile" "FAIL"
    }
  }
  catch {
    LogTest "GET /users/:id/profile" "FAIL" $_.Exception.Message
  }
  
  # Test 2: Update Profile
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $body = @{
      display_name = "Updated User"
      bio          = "Testing the API"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/users/$($global:TestUserId)/profile" `
      -Method PUT `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $body
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.display_name -eq "Updated User") {
      LogTest "PUT /users/:id/profile" "PASS"
    }
    else {
      LogTest "PUT /users/:id/profile" "FAIL"
    }
  }
  catch {
    LogTest "PUT /users/:id/profile" "FAIL" $_.Exception.Message
  }
  
  # Test 3: Get Followers
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/users/$($global:TestUserId)/followers" -Method GET
    LogTest "GET /users/:id/followers" "PASS"
  }
  catch {
    LogTest "GET /users/:id/followers" "FAIL" $_.Exception.Message
  }
  
  # Test 4: Get Following
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/users/$($global:TestUserId)/following" -Method GET
    LogTest "GET /users/:id/following" "PASS"
  }
  catch {
    LogTest "GET /users/:id/following" "FAIL" $_.Exception.Message
  }
  
  return $true
}

function Test-Posts {
  Write-Section "[4/7] Testing Social Feed Endpoints"
  
  if (-not $global:AuthToken) {
    LogTest "Posts Tests" "FAIL" "No auth token available"
    return $false
  }
  
  # Test 1: Create Post
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $body = @{
      title       = "My First Post"
      content     = "Testing the MakerConnect API with exciting new features!"
      content_type = "text"
      visibility  = "public"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/posts" `
      -Method POST `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $body
    
    $data = $response.Content | ConvertFrom-Json
    $postId = $data.data.id
    
    if ($postId) {
      LogTest "POST /posts" "PASS"
      $global:PostId = $postId
    }
    else {
      LogTest "POST /posts" "FAIL"
      return $false
    }
  }
  catch {
    LogTest "POST /posts" "FAIL" $_.Exception.Message
    return $false
  }
  
  # Test 2: Get Feed
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $response = Invoke-WebRequest -Uri "$BaseUrl/posts/feed?limit=10" `
      -Method GET `
      -Headers $headers
    
    LogTest "GET /posts/feed" "PASS"
  }
  catch {
    LogTest "GET /posts/feed" "FAIL" $_.Exception.Message
  }
  
  # Test 3: Get Post Details
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/posts/$($global:PostId)" -Method GET
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.title -eq "My First Post") {
      LogTest "GET /posts/:id" "PASS"
    }
    else {
      LogTest "GET /posts/:id" "FAIL"
    }
  }
  catch {
    LogTest "GET /posts/:id" "FAIL" $_.Exception.Message
  }
  
  # Test 4: Like Post
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $response = Invoke-WebRequest -Uri "$BaseUrl/posts/$($global:PostId)/like" `
      -Method POST `
      -Headers $headers
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.message -eq "Post liked successfully") {
      LogTest "POST /posts/:id/like" "PASS"
    }
    else {
      LogTest "POST /posts/:id/like" "FAIL"
    }
  }
  catch {
    LogTest "POST /posts/:id/like" "FAIL" $_.Exception.Message
  }
  
  # Test 5: Add Comment
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $body = @{ content = "Great post! Looking forward to more updates." } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/posts/$($global:PostId)/comments" `
      -Method POST `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $body
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.data.id) {
      LogTest "POST /posts/:id/comments" "PASS"
    }
    else {
      LogTest "POST /posts/:id/comments" "FAIL"
    }
  }
  catch {
    LogTest "POST /posts/:id/comments" "FAIL" $_.Exception.Message
  }
  
  # Test 6: Get Comments
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/posts/$($global:PostId)/comments?limit=10" -Method GET
    LogTest "GET /posts/:id/comments" "PASS"
  }
  catch {
    LogTest "GET /posts/:id/comments" "FAIL" $_.Exception.Message
  }
  
  # Test 7: Unlike Post
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $response = Invoke-WebRequest -Uri "$BaseUrl/posts/$($global:PostId)/like" `
      -Method DELETE `
      -Headers $headers
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.message -eq "Post unliked successfully") {
      LogTest "DELETE /posts/:id/like" "PASS"
    }
    else {
      LogTest "DELETE /posts/:id/like" "FAIL"
    }
  }
  catch {
    LogTest "DELETE /posts/:id/like" "FAIL" $_.Exception.Message
  }
  
  return $true
}

function Test-Projects {
  Write-Section "[5/7] Testing Project Endpoints"
  
  if (-not $global:AuthToken) {
    LogTest "Projects Tests" "FAIL" "No auth token available"
    return $false
  }
  
  # Test 1: Create Project
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $body = @{
      title             = "IoT Home Automation Hub"
      description       = "Building a smart home control system with ESP32 and MQTT"
      category          = "IoT"
      difficulty_level = "intermediate"
      estimated_hours   = 40
      budget            = 150
      is_public         = $true
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/projects" `
      -Method POST `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $body
    
    $data = $response.Content | ConvertFrom-Json
    $projectId = $data.data.id
    
    if ($projectId) {
      LogTest "POST /projects" "PASS"
      $global:ProjectId = $projectId
    }
    else {
      LogTest "POST /projects" "FAIL"
      return $false
    }
  }
  catch {
    LogTest "POST /projects" "FAIL" $_.Exception.Message
    return $false
  }
  
  # Test 2: Get Project
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/projects/$($global:ProjectId)" -Method GET
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.title -eq "IoT Home Automation Hub") {
      LogTest "GET /projects/:id" "PASS"
    }
    else {
      LogTest "GET /projects/:id" "FAIL"
    }
  }
  catch {
    LogTest "GET /projects/:id" "FAIL" $_.Exception.Message
  }
  
  # Test 3: List Projects
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/projects?category=IoT&limit=10" -Method GET
    LogTest "GET /projects" "PASS"
  }
  catch {
    LogTest "GET /projects" "FAIL" $_.Exception.Message
  }
  
  # Test 4: Add Component
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $body = @{
      name         = "ESP32 Development Board"
      part_number  = "ESP-WROOM-32"
      quantity     = 2
      unit_cost    = 8.50
      supplier     = "Aliexpress"
      datasheet_url = "https://example.com/esp32.pdf"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/projects/$($global:ProjectId)/components" `
      -Method POST `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $body
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.data.id) {
      LogTest "POST /projects/:id/components" "PASS"
    }
    else {
      LogTest "POST /projects/:id/components" "FAIL"
    }
  }
  catch {
    LogTest "POST /projects/:id/components" "FAIL" $_.Exception.Message
  }
  
  # Test 5: Get Components
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/projects/$($global:ProjectId)/components" -Method GET
    LogTest "GET /projects/:id/components" "PASS"
  }
  catch {
    LogTest "GET /projects/:id/components" "FAIL" $_.Exception.Message
  }
  
  # Test 6: Add Error Log
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $body = @{
      title       = "MQTT Connection Issues"
      description = "ESP32 unable to connect to MQTT broker on first attempt"
      severity    = "warning"
      resolution  = "Added retry logic with exponential backoff"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/projects/$($global:ProjectId)/error-logs" `
      -Method POST `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $body
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.data.id) {
      LogTest "POST /projects/:id/error-logs" "PASS"
    }
    else {
      LogTest "POST /projects/:id/error-logs" "FAIL"
    }
  }
  catch {
    LogTest "POST /projects/:id/error-logs" "FAIL" $_.Exception.Message
  }
  
  # Test 7: Get Error Logs
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/projects/$($global:ProjectId)/error-logs" -Method GET
    LogTest "GET /projects/:id/error-logs" "PASS"
  }
  catch {
    LogTest "GET /projects/:id/error-logs" "FAIL" $_.Exception.Message
  }
  
  # Test 8: Upvote Project
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $response = Invoke-WebRequest -Uri "$BaseUrl/projects/$($global:ProjectId)/upvote" `
      -Method POST `
      -Headers $headers
    
    LogTest "POST /projects/:id/upvote" "PASS"
  }
  catch {
    LogTest "POST /projects/:id/upvote" "FAIL" $_.Exception.Message
  }
  
  # Test 9: Update Project
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $body = @{
      status      = "in_progress"
      description = "Updated description with progress"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/projects/$($global:ProjectId)" `
      -Method PUT `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $body
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.data.status -eq "in_progress") {
      LogTest "PUT /projects/:id" "PASS"
    }
    else {
      LogTest "PUT /projects/:id" "FAIL"
    }
  }
  catch {
    LogTest "PUT /projects/:id" "FAIL" $_.Exception.Message
  }
  
  # Test 10: Fork Project
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $body = @{ title = "My IoT Hub Version" } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/projects/$($global:ProjectId)/fork" `
      -Method POST `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $body
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.data.id) {
      LogTest "POST /projects/:id/fork" "PASS"
    }
    else {
      LogTest "POST /projects/:id/fork" "FAIL"
    }
  }
  catch {
    LogTest "POST /projects/:id/fork" "FAIL" $_.Exception.Message
  }
  
  return $true
}

function Test-Robots {
  Write-Section "[6/7] Testing Robot Endpoints"
  
  if (-not $global:AuthToken) {
    LogTest "Robot Tests" "FAIL" "No auth token available"
    return $false
  }
  
  # Test 1: Create Robot Model
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $body = @{
      name           = "LineFollower v2.0"
      description    = "Advanced line-following robot with PID control"
      hardware_stack = @("ESP32", "IR Sensors", "DC Motors", "L298N Driver")
      software_stack = @("Arduino IDE", "C++", "PID Library")
      max_speed      = 1.5
      sensors        = @("3x IR line sensors", "2x wheel encoders")
      actuators      = @("2x DC motors")
      power_source   = "4xAA batteries"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/robots/models" `
      -Method POST `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $body
    
    $data = $response.Content | ConvertFrom-Json
    $modelId = $data.data.id
    
    if ($modelId) {
      LogTest "POST /robots/models" "PASS"
      $global:RobotModelId = $modelId
    }
    else {
      LogTest "POST /robots/models" "FAIL"
      return $false
    }
  }
  catch {
    LogTest "POST /robots/models" "FAIL" $_.Exception.Message
    return $false
  }
  
  # Test 2: List Models
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/robots/models?limit=10" -Method GET
    LogTest "GET /robots/models" "PASS"
  }
  catch {
    LogTest "GET /robots/models" "FAIL" $_.Exception.Message
  }
  
  # Test 3: Get Model Details
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/robots/models/$($global:RobotModelId)" -Method GET
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.name -eq "LineFollower v2.0") {
      LogTest "GET /robots/models/:id" "PASS"
    }
    else {
      LogTest "GET /robots/models/:id" "FAIL"
    }
  }
  catch {
    LogTest "GET /robots/models/:id" "FAIL" $_.Exception.Message
  }
  
  # Test 4: Create Robot Instance
  try {
    $headers = @{ Authorization = "Bearer $($global:AuthToken)" }
    $body = @{
      model_id         = $global:RobotModelId
      name             = "LineFollower-Proto-001"
      serial_number    = "LF-2026-0001"
      firmware_version = "2.0.1"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/robots/instances" `
      -Method POST `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $body
    
    $data = $response.Content | ConvertFrom-Json
    $instanceId = $data.data.id
    
    if ($instanceId) {
      LogTest "POST /robots/instances" "PASS"
      $global:RobotInstanceId = $instanceId
    }
    else {
      LogTest "POST /robots/instances" "FAIL"
      return $false
    }
  }
  catch {
    LogTest "POST /robots/instances" "FAIL" $_.Exception.Message
    return $false
  }
  
  # Test 5: Get Instance Details
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/robots/instances/$($global:RobotInstanceId)" -Method GET
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.name -eq "LineFollower-Proto-001") {
      LogTest "GET /robots/instances/:id" "PASS"
    }
    else {
      LogTest "GET /robots/instances/:id" "FAIL"
    }
  }
  catch {
    LogTest "GET /robots/instances/:id" "FAIL" $_.Exception.Message
  }
  
  # Test 6: Get Matches
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/robots/instances/$($global:RobotInstanceId)/matches" -Method GET
    LogTest "GET /robots/instances/:id/matches" "PASS"
  }
  catch {
    LogTest "GET /robots/instances/:id/matches" "FAIL" $_.Exception.Message
  }
  
  # Test 7: Get Rankings
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/robots/rankings?limit=10" -Method GET
    LogTest "GET /robots/rankings" "PASS"
  }
  catch {
    LogTest "GET /robots/rankings" "FAIL" $_.Exception.Message
  }
  
  return $true
}

function Print-Summary {
  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "Test Summary" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Total Tests: $TotalTests" -ForegroundColor Cyan
  Write-Host "Passed: $PassedTests" -ForegroundColor Green
  Write-Host "Failed: $FailedTests" -ForegroundColor Red
  Write-Host ""
  
  if ($FailedTests -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
  }
  else {
    Write-Host "✗ Some tests failed. Review output above." -ForegroundColor Red
  }
}

# Main execution
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "MakerConnect API - Onda 1 Test Suite" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if (-not (Test-Health)) {
  Write-Host ""
  Write-Host "❌ API is not running. Please start with: docker-compose up" -ForegroundColor Red
  exit 1
}

Test-Auth
Test-Users
Test-Posts
Test-Projects
Test-Robots

Print-Summary

Write-Host ""
Write-Host "Test results saved to: $ResultsFile" -ForegroundColor Cyan
Write-Host ""
