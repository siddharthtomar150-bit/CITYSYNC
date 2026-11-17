@echo off
title CITYSYNC - Smart City Intelligence Platform
echo ===================================================
echo Starting CITYSYNC Smart City Command Center...
echo ===================================================

cd /d "%~dp0"
set PYTHONPATH=backend

if exist .venv\Scripts\python.exe (
    set PYTHON_EXEC=.venv\Scripts\python.exe
) else (
    set PYTHON_EXEC=python
)

echo Using Python: %PYTHON_EXEC%
echo Access the Command Center at: http://127.0.0.1:8000
echo Interactive API Docs at:     http://127.0.0.1:8000/docs
echo ===================================================

%PYTHON_EXEC% -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
