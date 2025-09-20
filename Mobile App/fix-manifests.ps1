# Fix AndroidManifest.xml files by removing package attributes
Write-Host "Fixing AndroidManifest.xml files..." -ForegroundColor Green

# List of libraries that need manifest fixes
$libraries = @(
    "react-native-linear-gradient",
    "react-native-haptic-feedback", 
    "react-native-svg",
    "react-native-push-notification",
    "@react-native-community/netinfo",
    "@react-native-async-storage/async-storage",
    "react-native-safe-area-context",
    "react-native-geolocation-service"
)

foreach ($lib in $libraries) {
    $manifestPath = "node_modules\$lib\android\src\main\AndroidManifest.xml"
    
    if (Test-Path $manifestPath) {
        Write-Host "Fixing $lib..." -ForegroundColor Yellow
        
        # Read the file
        $content = Get-Content $manifestPath -Raw
        
        # Remove package attribute from manifest tag
        $content = $content -replace 'package="[^"]*"\s*', ''
        
        # Write back to file
        Set-Content $manifestPath $content -NoNewline
        Write-Host "Fixed $lib" -ForegroundColor Green
    } else {
        Write-Host "Warning: $lib manifest not found" -ForegroundColor Red
    }
}

Write-Host "All manifest fixes complete!" -ForegroundColor Green
Write-Host "Now running the app..." -ForegroundColor Yellow

# Run the app
npx react-native run-android
