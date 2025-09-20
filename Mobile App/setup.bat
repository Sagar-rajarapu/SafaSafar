@echo off
echo Setting up SafeSafar React Native App...
echo.

echo Installing dependencies...
npm install

echo.
echo Installing React Native CLI globally (if not already installed)...
npm install -g @react-native-community/cli

echo.
echo Running test build check...
node test-build.js

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Start your Pixel 7 Android emulator
echo 2. Run: run-android.bat
echo.
pause









