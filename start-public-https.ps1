param(
  [int]$Port = 5501
)

$ErrorActionPreference = 'SilentlyContinue'

Write-Host '[PUBLIC] Preparing secure HTTPS share link...' -ForegroundColor Cyan

$localUrl = "http://localhost:$Port"

try {
  $test = Invoke-WebRequest -UseBasicParsing $localUrl -TimeoutSec 4
  if ($test.StatusCode -ne 200) {
    Write-Host "[PUBLIC] Local server did not return 200 on $localUrl" -ForegroundColor Yellow
  }
} catch {
  Write-Host '[PUBLIC] Local LAN server is not running. Start it first with run-lan-server.ps1.' -ForegroundColor Red
  exit 1
}

$hasCloudflared = [bool](Get-Command cloudflared -ErrorAction SilentlyContinue)
if (-not $hasCloudflared) {
  Write-Host '[PUBLIC] cloudflared is not installed.' -ForegroundColor Yellow
  Write-Host '[PUBLIC] Install options:' -ForegroundColor Yellow
  Write-Host '  winget install --id Cloudflare.cloudflared -e' -ForegroundColor White
  Write-Host 'Then re-run this script.' -ForegroundColor Yellow
  exit 1
}

Write-Host '[PUBLIC] Starting Cloudflare Quick Tunnel...' -ForegroundColor Green
Write-Host '[PUBLIC] Copy the HTTPS URL shown below and share it.' -ForegroundColor Green
Write-Host '[PUBLIC] Keep this terminal open while others play.' -ForegroundColor Green

cloudflared tunnel --url $localUrl
