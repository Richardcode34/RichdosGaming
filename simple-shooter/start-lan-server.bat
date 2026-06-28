@echo off
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"
powershell -ExecutionPolicy Bypass -NoProfile -File "%SCRIPT_DIR%run-lan-server.ps1"
