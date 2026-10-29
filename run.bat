@echo off
title ItadyTrano - Launcher

echo ==========================================
echo   Lancement d'ItadyTrano (Backend + Frontend)
echo ==========================================

:: Lancement du Backend
echo [1/2] Demarrage du Backend Spring Boot...
start "Backend - Spring Boot" cmd /k "cd backend\demo && gradlew bootRun"

:: Lancement du Frontend
echo [2/2] Demarrage du Frontend Angular...
start "Frontend - Angular" cmd /k "cd frontend && npm start"

echo.
echo Les services sont en cours de demarrage dans des fenetres separees.
pause
