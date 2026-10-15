@echo off
title GroCrawl - SEO Spider
cd /d "%~dp0"

if not exist data mkdir data

echo ================================================================================
echo GroCrawl - Web-Based SEO Spider (Screaming Frog Alternative)
echo ================================================================================
echo.

if exist .venv\Scripts\python.exe (
    set PYTHON=.venv\Scripts\python.exe
) else (
    set PYTHON=python
)

echo Starting GroCrawl backend...
set PYTHONIOENCODING=utf-8
start "" http://localhost:5000
"%PYTHON%" -X utf8 main.py -l

pause
