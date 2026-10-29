@echo off
chcp 65001 > nul
echo ===================================================
echo  近隣1km 飲食店マップ アプリを起動しています...
echo ===================================================
echo.
start http://localhost:3000
node server.js
pause
