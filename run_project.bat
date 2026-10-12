@echo off
title BizSmart - Run Project All-in-One
echo ===================================================================
echo               BizSmart - Smart Retail Management System
echo ===================================================================
echo.
echo Starting both Backend (Spring Boot :8080) and Frontend (Vite :5173)...
echo.

cd /d "%~dp0"

:: 1. Launch Spring Boot Backend in a new console window
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/2] Starting Spring Boot Backend in background console...
    start "BizSmart Backend (:8080)" cmd /k "cd /d "%~dp0backend" && mvn spring-boot:run"
) else (
    echo [NOTICE] Maven is not detected on system PATH.
    echo If running without Maven, the Frontend will operate in standalone client mode.
)

:: 2. Launch React Frontend in a new console window
echo [2/2] Starting React Vite Frontend in background console...
start "BizSmart Frontend (:5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================================
echo Both services have been launched!
echo - Frontend UI will be available at: http://localhost:5173
echo - Backend API will be available at: http://localhost:8080
echo ===================================================================
echo Keep the opened terminal windows running while using the application.
timeout /t 5 >nul
