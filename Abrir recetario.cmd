@echo off
cd /d "%~dp0"
python scripts\launch.py
if errorlevel 1 pause
