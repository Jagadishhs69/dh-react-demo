@echo off
REM Windsurf Local CI/CD Pipeline Startup Script for Windows
REM This script starts the local file watcher that monitors /src directory

echo.
echo 🚀 Starting Windsurf Local CI/CD Pipeline...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found
    echo Please run this script from the local-pipeline directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Create src directory if it doesn't exist
if not exist "..\src" (
    echo 📁 Creating src directory...
    mkdir "..\src"
    echo // Sample file to trigger pipeline > "..\src\sample.js"
    echo console.log('Hello Windsurf CI/CD!'); >> "..\src\sample.js"
)

echo ✅ Setup complete!
echo.
echo 👀 Monitoring directory: %cd%\..\src
echo 🔄 Pipeline will run automatically when files change
echo 🛑 Press Ctrl+C to stop
echo.

REM Start the file watcher
node file-watcher.js

pause
