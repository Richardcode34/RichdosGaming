@echo off
set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%enable-lan-firewall.ps1

if not exist "%PS_SCRIPT%" (
  echo Missing script: %PS_SCRIPT%
  pause
  exit /b 1
)

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Requesting Administrator permission to add firewall rule...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -Verb RunAs -FilePath 'powershell.exe' -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%PS_SCRIPT%\"'"
  exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
echo.
echo Done. If rule was created, other LAN devices can connect on port 5501.
pause
