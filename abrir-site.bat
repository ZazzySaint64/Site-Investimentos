@echo off
title Site Investimentos
cd /d "%~dp0web"

where npm >nul 2>nul
if errorlevel 1 goto sem_node
if not exist ".env.local" goto sem_env

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0porta-3000.ps1" -Pasta "%CD%"
if errorlevel 2 goto porta_ocupada
if errorlevel 1 goto ja_aberto

if exist "node_modules\next" goto iniciar
echo Instalando dependencias. Isso acontece so na primeira vez...
call npm install
if errorlevel 1 goto falha

:iniciar
echo.
echo Abrindo http://localhost:3000 no navegador em alguns segundos.
echo Deixe esta janela aberta enquanto testa. Para parar, feche a janela.
echo.
start "" /min cmd /c "ping -n 7 127.0.0.1 >nul & start http://localhost:3000"
call npm run dev -- -p 3000
goto falha

:ja_aberto
echo O site ja esta rodando. Abrindo no navegador.
start http://localhost:3000
exit /b 0

:porta_ocupada
echo Outro programa esta usando a porta 3000. Feche esse programa e tente de novo.
pause
exit /b 1

:sem_node
echo Node.js nao encontrado. Instale em https://nodejs.org e tente de novo.
pause
exit /b 1

:sem_env
echo Falta o arquivo web\.env.local. Copie web\.env.example e preencha com a URL
echo do projeto Supabase e a chave publicavel.
pause
exit /b 1

:falha
echo.
echo O site parou. Veja a mensagem acima.
pause
exit /b 1
