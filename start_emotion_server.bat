@echo off
title Emotion Analysis Server
echo ===================================================
echo   STARTING EMOTION ANALYSIS SERVER
echo ===================================================
echo.

cd /d "%~dp0python_emotion_server"

if not exist "venv\" (
    echo [ERROR] Setup not complete!
    echo Please run SETUP_EMOTION_SERVER.bat first
    echo.
    pause
    exit /b 1
)

echo [INFO] Activating Python environment...
call venv\Scripts\activate

echo [INFO] Starting server on http://127.0.0.1:8000
echo.
echo ===================================================
echo   SERVER READY - Keep this window open!
echo ===================================================
echo   Now run your Next.js app in another terminal
echo   Press Ctrl+C to stop the server
echo ===================================================
echo.

python app.py
