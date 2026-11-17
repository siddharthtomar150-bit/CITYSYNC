Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting CITYSYNC Smart City Command Center..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($ScriptDir) { Set-Location $ScriptDir }

$env:PYTHONPATH = "backend"

if (Test-Path ".\.venv\Scripts\python.exe") {
    $PythonExec = ".\.venv\Scripts\python.exe"
} else {
    $PythonExec = "python"
}

Write-Host "Using Python: $PythonExec" -ForegroundColor Green
Write-Host "Command Center URL: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "API Documentation:  http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

& $PythonExec -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
