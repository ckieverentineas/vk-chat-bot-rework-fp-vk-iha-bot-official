@echo off
cd %~dp0
call npm run dev
echo 'Stop'
pause
cmd /k