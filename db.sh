echo Настройка файла dev.db
npx prisma migrate dev --name init
npx prisma generate
echo Успешно!
clear
exit
