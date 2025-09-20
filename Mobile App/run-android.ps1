# SafeSafar Android App Runner
Write-Host "Starting SafeSafar Android App..." -ForegroundColor Green
Write-Host ""

# Check if emulator is running
Write-Host "Checking connected devices..." -ForegroundColor Yellow
adb devices

Write-Host ""
Write-Host "Starting Metro bundler in background..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "npx react-native start" -WindowStyle Normal

Write-Host ""
Write-Host "Waiting 10 seconds for Metro to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Building and installing app on Android emulator..." -ForegroundColor Yellow
npx react-native run-android

Write-Host ""
Write-Host "App installation complete!" -ForegroundColor Green
Write-Host "Check your emulator for the SafeSafar app." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")









