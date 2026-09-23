@echo off
echo ========================================
echo   SUBIDA AUTOMATICA A GITHUB
echo ========================================
echo.

:: Te pide que escribas el mensaje para el guardado (prompt)
set /p mensaje="Escribe los cambios que has hecho (ej. Nuevo script first contact): "

:: Añade todos los archivos modificados
git add .

:: Guarda los cambios con el mensaje que has escrito
git commit -m "%mensaje%"

:: Sube los cambios a la rama principal (main) de tu GitHub
git push origin main

echo.
echo ========================================
echo   ¡Subida completada con exito!
echo ========================================
pause