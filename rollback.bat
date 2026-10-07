@echo off
REM Mission-RX One-Click Baseline Rollback Wrapper
echo ==========================================================
echo  [Mission-RX] One-Click Baseline Rollback
echo ==========================================================
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\rollback_to_baseline.ps1" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Rollback encountered an issue. See output above.
    pause
)
