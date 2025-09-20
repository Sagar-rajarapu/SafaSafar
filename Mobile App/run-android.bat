@echo off
echo Starting SafeSafar Android App...
echo.

echo Checking if emulator is running...
adb devices

echo.
echo Starting Metro bundler...
start "Metro Bundler" cmd /k "npx react-native start"

echo.
echo Waiting 5 seconds for Metro to start...
timeout /t 5 /nobreak > nul

echo.
echo Building and installing app on Android emulator...
npx react-native run-android

echo.
echo App installation complete!
echo Check your emulator for the SafeSafar app.
pause