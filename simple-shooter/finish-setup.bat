@echo off
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%finish-setup.ps1"
pause
