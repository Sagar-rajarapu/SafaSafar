@echo off
echo Fixing Android Emulator Issues...
echo.

echo Step 1: Killing any existing emulator processes...
taskkill /f /im emulator.exe 2>nul
taskkill /f /im qemu-system-x86_64.exe 2>nul

echo.
echo Step 2: Starting emulator with safe parameters...
start "Android Emulator" "C:\Users\sunil\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd SafeSafar_Emulator -no-audio -gpu swiftshader_indirect -memory 4096

echo.
echo Step 3: Waiting for emulator to start (30 seconds)...
timeout /t 30 /nobreak > nul

echo.
echo Step 4: Checking emulator status...
adb devices

echo.
echo Step 5: If emulator is running, installing the app...
adb devices | find "device" >nul
if %errorlevel%==0 (
    echo Emulator detected! Installing SafeSafar app...
    npx react-native run-android
) else (
    echo Emulator not ready. Please start it manually from Android Studio.
    echo Then run: npx react-native run-android
)

echo.
pause









