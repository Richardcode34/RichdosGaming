param(
  [string]$BaseUrl = "http://localhost:5501"
)

$ErrorActionPreference = "Stop"

$pages = @(
  "/index.html",
  "/account.html",
  "/shop.html",
  "/inventory.html",
  "/leaderboard.html",
  "/messages.html",
  "/updates.html",
  "/help-center.html",
  "/ai-assistant.html"
)

$apis = @(
  "/api/accounts",
  "/api/rooms"
)

$failed = @()

function Test-Url {
  param(
    [string]$Url,
    [string]$Kind
  )

  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -eq 200) {
      Write-Output ("PASS [{0}] {1}" -f $Kind, $Url)
      return
    }
    $script:failed += ("{0} status {1} :: {2}" -f $Kind, $r.StatusCode, $Url)
    Write-Output ("FAIL [{0}] status {1} {2}" -f $Kind, $r.StatusCode, $Url)
  } catch {
    $script:failed += ("{0} error :: {1} :: {2}" -f $Kind, $Url, $_.Exception.Message)
    Write-Output ("FAIL [{0}] {1} -> {2}" -f $Kind, $Url, $_.Exception.Message)
  }
}

Write-Output ("Running smoke tests against {0}" -f $BaseUrl)

foreach ($p in $pages) {
  Test-Url -Url ($BaseUrl + $p) -Kind "PAGE"
}

foreach ($a in $apis) {
  Test-Url -Url ($BaseUrl + $a) -Kind "API"
}

if ($failed.Count -gt 0) {
  Write-Output ""
  Write-Output "Smoke test failures:"
  $failed | ForEach-Object { Write-Output (" - " + $_) }
  exit 1
}

Write-Output ""
Write-Output "All smoke tests passed."
exit 0
