@echo off
echo ========================================
echo SafeSafar React Native Fix & Run Script
echo ========================================
echo.

echo Step 1: Stopping any running Metro processes...
taskkill /f /im node.exe >nul 2>&1

echo Step 2: Checking device connection...
adb devices

echo.
echo Step 3: Setting up port forwarding...
adb reverse tcp:8081 tcp:8081

echo.
echo Step 4: Starting Metro bundler with cache reset...
start "Metro Bundler" cmd /k "npx react-native start --reset-cache"

echo.
echo Waiting 5 seconds for Metro to start...
timeout /t 5 /nobreak >nul

echo.
echo Step 5: Testing bundle URL...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8081/index.bundle?platform=android&dev=true&minify=false&app=com.safesafar' -Method Head | Select-Object StatusCode } catch { Write-Host 'Bundle test failed' }"

echo.
echo Step 6: Building and running the app...
npx react-native run-android

echo.
echo Step 7: Reloading the app...
adb shell input keyevent 82
timeout /t 2 /nobreak >nul
adb shell input text "RR"

echo.
echo ========================================
echo Fix and run complete!
echo Check your emulator for the SafeSafar app.
echo ========================================
pause
