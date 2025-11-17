@echo off
echo ========================================
echo   Iniciando Backend Server
echo ========================================
echo.

cd apps\server

echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

echo.
echo Iniciando servidor...
echo.
echo IMPORTANTE: Mantenha este terminal aberto!
echo O servidor estara rodando em http://localhost:3000
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.

call npm run dev

pause

