@echo off
REM ==========================================================================
REM  LocaMaison - lancement sur Windows (double-cliquez ce fichier)
REM  Lance le serveur (Spring Boot) et l'interface (Angular).
REM ==========================================================================
title LocaMaison - lancement
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0lancer-windows.ps1"
pause
