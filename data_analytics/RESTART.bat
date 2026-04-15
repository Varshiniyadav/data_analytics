@echo off
echo ========================================
echo Restarting Sales Intelligence Dashboard
echo ========================================
echo.

echo [1/3] Stopping any existing servers...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *api.py*" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *npm*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Starting Backend Server...
start "Backend - Sales Intelligence API" cmd /k "cd backend && python api.py"
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Starting Frontend Server...
start "Frontend - Sales Intelligence Dashboard" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Check the new terminal windows for status.
echo Wait 10-15 seconds for servers to fully start.
echo.
echo Then open: http://localhost:3000
echo.
pause
