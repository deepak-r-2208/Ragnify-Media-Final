@echo off
cd /d "%~dp0..\backend"
python -m unittest discover -s tests -v
