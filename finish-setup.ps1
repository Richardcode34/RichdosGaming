$ErrorActionPreference = 'SilentlyContinue'

function Write-Step($msg) {
  Write-Host "[SETUP] $msg" -ForegroundColor Cyan
}

function Rule-Exists {
  param([string]$Name)
  return [bool](Get-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue)
}

$ruleName = 'Richdos Gaming LAN 5501'
$port = 5501

Write-Step 'Checking LAN server endpoints...'
$homeOk = $false
$apiOk = $false
try {
  $h = Invoke-WebRequest -UseBasicParsing "http://localhost:$port/" -TimeoutSec 3
  $homeOk = ($h.StatusCode -eq 200)
} catch {}
try {
  $a = Invoke-WebRequest -UseBasicParsing "http://localhost:$port/api/accounts" -TimeoutSec 3
  $apiOk = ($a.StatusCode -eq 200)
} catch {}

if (-not $homeOk -or -not $apiOk) {
  Write-Step 'Starting LAN server on port 5501...'
  Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File \"$PSScriptRoot\run-lan-server.ps1\" -Port 5501"
  Start-Sleep -Milliseconds 700
}

Write-Step 'Checking firewall rule...'
if (-not (Rule-Exists -Name $ruleName)) {
  Write-Host 'Firewall rule missing. Requesting Administrator permission...' -ForegroundColor Yellow
  Start-Process -Verb RunAs -FilePath powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File \"$PSScriptRoot\enable-lan-firewall.ps1\""
  Write-Host 'Approve the UAC popup to finish firewall setup.' -ForegroundColor Yellow
} else {
  Write-Host 'Firewall rule already exists.' -ForegroundColor Green
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $ip) { $ip = '<your-ip>' }

Write-Host ''
Write-Host 'LAN URL for other devices:' -ForegroundColor Green
Write-Host ("http://{0}:{1}/" -f $ip, $port) -ForegroundColor Green
Write-Host ''
Write-Host 'Done. Keep the LAN server terminal open while others play.' -ForegroundColor Cyan
