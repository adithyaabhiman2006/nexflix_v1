@echo off
title Nexflix private preview
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo PROBLEM: Node.js is not installed. Ask Claude to install it.
  pause
  exit /b 1
)
node server\preview.js
pause
