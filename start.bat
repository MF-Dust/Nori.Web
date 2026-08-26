@echo off
setlocal
cd /d "%~dp0"
echo =======================================================
echo         Starting NoriOS local compatibility server
echo =======================================================
python --version >nul 2>&1
if errorlevel 1 (
    echo Python 3 is required. Install dependencies with:
    echo   python -m pip install -r requirements.txt
    pause
    exit /b 1
)
python server.py
pause
