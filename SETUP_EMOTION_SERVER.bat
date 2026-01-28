@echo off
echo ===================================================
echo   EMOTION ANALYSIS - ONE-TIME SETUP
echo ===================================================
echo.

cd /d "%~dp0python_emotion_server"

echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo.
    echo Please install Python 3.8+ from:
    echo https://www.python.org/downloads/
    echo.
    echo Make sure to CHECK "Add Python to PATH" during installation!
    echo.
    pause
    exit /b 1
)
echo [OK] Python found
echo.

echo [2/4] Creating virtual environment...
if exist "venv\" (
    echo [SKIP] Virtual environment already exists
) else (
    python -m venv venv
    echo [OK] Virtual environment created
)
echo.

echo [3/4] Installing dependencies...
echo This will download the emotion model (~500MB)
echo Please wait 2-5 minutes...
echo.
call venv\Scripts\activate
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Installation failed!
    pause
    exit /b 1
)
echo.
echo [OK] Dependencies installed
echo.

echo [4/4] Setup complete!
echo.
echo ===================================================
echo   READY TO USE!
echo ===================================================
echo.
echo To start the emotion analysis:
echo   1. Run: start_emotion_server.bat
echo   2. Then run your Next.js app: npm start
echo.
echo The local server provides 100x faster analysis!
echo.
pause
