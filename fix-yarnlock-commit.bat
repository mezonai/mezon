@echo off
echo Fixing yarn.lock - adding commit to restore it...
cd /d c:\Users\luc.nguyentat\mezon

git add yarn.lock
if errorlevel 1 (
    echo ERROR: git add failed. Make sure to close Cursor/VS Code first, then run this script again.
    pause
    exit /b 1
)

git commit -m "chore: restore yarn.lock to match develop"
if errorlevel 1 (
    echo ERROR: git commit failed.
    pause
    exit /b 1
)

echo.
echo Done! yarn.lock has been restored. The PR will no longer show yarn.lock changes.
echo Now push: git push origin feat26a/webdesktop/voice-feature-update
echo.
pause
