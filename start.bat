@echo off
title AI Traffic Simulator Launcher
color 0A

echo.
echo  ============================================================
echo   AI Traffic Simulator - VTU ADA Mini Project 2024-25
echo  ============================================================
echo.

REM ── Start Flask Backend ──────────────────────────────────────
echo  [1/2] Starting Flask Backend on http://localhost:5000 ...
start "AI Backend" cmd /k "cd /d "%~dp0backend" && python app.py"

REM Wait 3 seconds for Flask to initialize
timeout /t 3 /nobreak >nul

REM ── Start React Frontend ─────────────────────────────────────
echo  [2/2] Starting React Frontend on http://localhost:3000 ...
start "AI Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

REM Wait 4 seconds for Vite to start
timeout /t 4 /nobreak >nul

REM ── Open Browser ─────────────────────────────────────────────
echo.
echo  Opening http://localhost:3000 in browser...
start "" "http://localhost:3000"

echo.
echo  ============================================================
echo   Both servers are running!
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:5000
echo   API Test : http://localhost:5000/api/health
echo  ============================================================
echo.
echo  Close the two terminal windows to stop the servers.
pause
