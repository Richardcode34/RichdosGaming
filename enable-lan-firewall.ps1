param(
  [int]$Port = 5501,
  [string]$RuleName = "Richdos Gaming LAN 5501"
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "Please run this script as Administrator." -ForegroundColor Yellow
  exit 1
}

$existing = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Firewall rule already exists: $RuleName" -ForegroundColor Green
  exit 0
}

New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Private -ErrorAction Stop | Out-Null
Write-Host "Firewall rule created for TCP port $Port (Private profile)." -ForegroundColor Green
