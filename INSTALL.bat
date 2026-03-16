@echo off
echo ╔═══════════════════════════════════════════════╗
echo ║  KK TRADING JOURNAL — INSTALLING DEPENDENCIES  ║
echo ╚═══════════════════════════════════════════════╝
echo.

:: Check Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/en/download
    echo.
    echo Choose the LTS version ^(Windows Installer^)
    echo Install with all defaults, then run this script again.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found:
node --version
echo.

echo Installing root dependencies...
call npm install
echo.

echo Installing backend dependencies...
cd backend
call npm install
cd ..
echo.

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo.

echo ╔═══════════════════════════════════╗
echo ║  ✅ INSTALLATION COMPLETE!         ║
echo ║                                   ║
echo ║  Double-click START.bat to run    ║
echo ╚═══════════════════════════════════╝
echo.
pause
