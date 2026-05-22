$ErrorActionPreference = "Stop"

function Get-LocalEnvValue {
    param(
        [string]$Name,
        [string]$Default
    )

    $processValue = [Environment]::GetEnvironmentVariable($Name)
    if ($processValue) {
        return $processValue
    }

    if (Test-Path ".env") {
        $match = Get-Content ".env" | Where-Object { $_ -match "^$Name=" } | Select-Object -First 1
        if ($match) {
            return ($match -replace "^$Name=", "").Trim('"').Trim("'")
        }
    }

    return $Default
}

$apiHostPort = Get-LocalEnvValue -Name "API_HOST_PORT" -Default "8010"
$webHostPort = Get-LocalEnvValue -Name "WEB_HOST_PORT" -Default "5180"
$apiUrl = "http://localhost:$apiHostPort"
$webUrl = "http://localhost:$webHostPort"
$viteApiBaseUrl = Get-LocalEnvValue -Name "VITE_API_BASE_URL" -Default $apiUrl
$corsOrigins = Get-LocalEnvValue -Name "CORS_ORIGINS" -Default "$webUrl,http://localhost:5173,http://localhost:5174"

if ($viteApiBaseUrl -ne $apiUrl) {
    throw "VITE_API_BASE_URL must be $apiUrl, got $viteApiBaseUrl"
}

if (($corsOrigins -split "," | ForEach-Object { $_.Trim() }) -notcontains $webUrl) {
    throw "CORS_ORIGINS must include $webUrl"
}

$compose = Get-Content "docker-compose.yml" -Raw
if ($compose -match '(?m)^\s*-\s*["'']?\d+:8000["'']?\s*$' -or $compose -match '(?m)^\s*-\s*["'']?\d+:5173["'']?\s*$') {
    throw "docker-compose.yml must use API_HOST_PORT and WEB_HOST_PORT for host ports"
}

docker compose config
docker compose up --build -d
docker compose ps
docker compose --profile tools run --rm migrate
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
npm --workspace packages/shared test
npm --workspace apps/web test
Push-Location apps/api
python -m pytest
Pop-Location
npm --workspace apps/web run build
node scripts/verify-docker-plan-api.mjs
Invoke-RestMethod -Uri "$apiUrl/health" | ConvertTo-Json
Invoke-WebRequest -Uri $webUrl -UseBasicParsing | Select-Object -ExpandProperty StatusCode
