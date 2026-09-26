@echo off
setlocal
cd /d "%~dp0.."

echo Starting RAGnify Media...
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo Startup failed. Run: docker compose logs --tail=200
  exit /b 1
)

echo.
echo RAGnify Media is starting.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000/docs
echo.
echo First startup downloads local Ollama models and can take several minutes.
