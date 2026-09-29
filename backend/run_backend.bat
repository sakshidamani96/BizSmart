@echo off
echo ===================================================================
echo Starting BizSmart Spring Boot Backend (:8080)...
echo ===================================================================
cd /d "%~dp0"
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    mvn spring-boot:run
) else (
    echo Maven is not found on PATH. Please install Maven or configure your IDE.
    echo In IntelliJ IDEA or VS Code, open BizSmart/backend and run BizSmartApplication.java directly.
    pause
)
