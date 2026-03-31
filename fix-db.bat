@echo off
cd /d "c:\Users\pc\Desktop\testing"
if exist prisma\dev.db del prisma\dev.db
echo Database deleted, recreating...
npx prisma migrate dev --name init --skip-generate
npx prisma generate
echo Done! Restart your dev server.
pause
