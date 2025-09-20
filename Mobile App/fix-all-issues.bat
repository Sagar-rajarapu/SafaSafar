@echo off
echo Fixing all Android build issues...
echo.

echo Step 1: Setting Java environment...
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Step 2: Clearing Gradle cache...
rmdir /s /q "%USERPROFILE%\.gradle\caches" 2>nul
rmdir /s /q "%USERPROFILE%\.gradle\daemon" 2>nul

echo Step 3: Installing required Android SDK components...
C:\Users\sunil\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat "cmake;3.22.1"
C:\Users\sunil\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat "ndk;23.1.7779620"
C:\Users\sunil\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat "build-tools;33.0.0"

echo Step 4: Cleaning project...
cd android
gradlew clean --no-daemon
cd ..

echo Step 5: Installing dependencies...
npm install

echo Step 6: Running the app...
npx react-native run-android

echo.
echo Fix complete!
pause






