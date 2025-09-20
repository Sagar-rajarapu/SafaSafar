Write-Host "========================================" -ForegroundColor Green
Write-Host "SafeSafar React Native Fix & Run Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Stopping any running Metro processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Step 2: Checking device connection..." -ForegroundColor Yellow
adb devices

Write-Host ""
Write-Host "Step 3: Setting up port forwarding..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081

Write-Host ""
Write-Host "Step 4: Starting Metro bundler with cache reset..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "npx react-native start --reset-cache" -WindowStyle Normal

Write-Host ""
Write-Host "Waiting 5 seconds for Metro to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Step 5: Testing bundle URL..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false&app=com.safesafar" -Method Head
    Write-Host "Bundle test successful: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Bundle test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 6: Building and running the app..." -ForegroundColor Yellow
npx react-native run-android

Write-Host ""
Write-Host "Step 7: Reloading the app..." -ForegroundColor Yellow
adb shell input keyevent 82
Start-Sleep -Seconds 2
adb shell input text "RR"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Fix and run complete!" -ForegroundColor Green
Write-Host "Check your emulator for the SafeSafar app." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
