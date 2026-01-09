@echo off
echo ========================================
echo   Synax Platform - ngrok Baslatma
echo ========================================
echo.
echo Next.js dev server'inin calistigindan emin olun!
echo Port 3000'de calisiyor mu kontrol ediliyor...
echo.

netstat -ano | findstr :3000 >nul
if %errorlevel% neq 0 (
    echo [HATA] Next.js dev server calismiyor!
    echo Lutfen once 'npm run dev' komutu ile Next.js'i baslatin.
    echo.
    pause
    exit /b 1
)

echo [OK] Next.js dev server calisiyor.
echo.
echo ngrok baslatiliyor...
echo.
echo ========================================
echo   Public URL asagida gorunecektir
echo ========================================
echo.

ngrok http 3000






echo ========================================
echo   Synax Platform - ngrok Baslatma
echo ========================================
echo.
echo Next.js dev server'inin calistigindan emin olun!
echo Port 3000'de calisiyor mu kontrol ediliyor...
echo.

netstat -ano | findstr :3000 >nul
if %errorlevel% neq 0 (
    echo [HATA] Next.js dev server calismiyor!
    echo Lutfen once 'npm run dev' komutu ile Next.js'i baslatin.
    echo.
    pause
    exit /b 1
)

echo [OK] Next.js dev server calisiyor.
echo.
echo ngrok baslatiliyor...
echo.
echo ========================================
echo   Public URL asagida gorunecektir
echo ========================================
echo.

ngrok http 3000
















