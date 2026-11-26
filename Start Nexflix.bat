@echo off
title Nexflix server
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo PROBLEM: Node.js is not installed. Ask Claude to install it.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:8080"
node server\server.js
pause
