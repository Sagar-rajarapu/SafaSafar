@echo off
echo Fixing CMake and Android SDK issues...
echo.

echo Step 1: Installing CMake 3.22.1...
C:\Users\sunil\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat "cmake;3.22.1"

echo.
echo Step 2: Installing NDK...
C:\Users\sunil\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat "ndk;23.1.7779620"

echo.
echo Step 3: Installing build tools...
C:\Users\sunil\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat "build-tools;33.0.0"

echo.
echo Step 4: Cleaning project...
cd android
gradlew clean
cd ..

echo.
echo Step 5: Running the app...
npx react-native run-android

echo.
echo Fix complete!
pause






