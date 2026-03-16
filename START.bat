@echo off
echo ╔═══════════════════════════════════════╗
echo ║  KK TRADING JOURNAL — KEVAL KABARIYA  ║
echo ╚═══════════════════════════════════════╝
echo.
echo Starting backend on http://localhost:5000
echo Starting frontend on http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers.
echo.

:: Start backend in new window
start "KK Journal - Backend" cmd /k "cd /d %~dp0backend && node server.js"

:: Wait a moment then start frontend
timeout /t 2 /nobreak > nul
start "KK Journal - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Open browser after a moment
timeout /t 4 /nobreak > nul
start http://localhost:3000

echo Both servers starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
