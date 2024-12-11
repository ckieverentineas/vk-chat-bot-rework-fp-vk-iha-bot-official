@echo off
cd %~dp0
call npx prisma migrate dev --name init
call npx prisma generate
echo 'Stop'
pause
cmd /k