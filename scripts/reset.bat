@echo off
cd /d "%~dp0.."
echo WARNING: this removes all RAGnify database data and downloaded Ollama models.
choice /M "Continue"
if errorlevel 2 exit /b 0
docker compose down -v
