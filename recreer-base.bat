@echo off
REM ItadyTrano - (re)creation de la base de donnees (double-cliquez ce fichier)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0recreer-base-windows.ps1"
pause
