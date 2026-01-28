@echo off
echo Starting Emotion Analysis Server...
echo.

cd /d "%~dp0"

if not exist "venv\" (
    echo [ERROR] Virtual environment not found!
    echo Please run setup first:
    echo   1. python -m venv venv
    echo   2. venv\Scripts\activate
    echo   3. pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

call venv\Scripts\activate

echo [INFO] Starting FastAPI server on http://127.0.0.1:8000
echo [INFO] Press Ctrl+C to stop
echo.

python app.py
