# Fix buildConfig issues for all React Native libraries
Write-Host "Fixing buildConfig issues for all React Native libraries..." -ForegroundColor Green

# List of libraries that might have buildConfig issues
$libraries = @(
    "react-native-vector-icons",
    "react-native-svg",
    "react-native-haptic-feedback",
    "react-native-safe-area-context",
    "react-native-screens",
    "react-native-gesture-handler"
)

foreach ($lib in $libraries) {
    $buildGradlePath = "node_modules\$lib\android\build.gradle"
    
    if (Test-Path $buildGradlePath) {
        Write-Host "Checking $lib..." -ForegroundColor Yellow
        
        # Read the file
        $content = Get-Content $buildGradlePath -Raw
        
        # Check if it has buildConfigField but no buildFeatures
        if ($content -match "buildConfigField" -and $content -notmatch "buildFeatures\s*\{") {
            Write-Host "Fixing buildConfig for $lib..." -ForegroundColor Yellow
            
            # Add buildFeatures after android {
            $content = $content -replace "(android\s*\{[^}]*?)(defaultConfig\s*\{)", "`$1`n    buildFeatures {`n        buildConfig true`n    }`n`n    `$2"
            
            # Write back to file
            Set-Content $buildGradlePath $content -NoNewline
            Write-Host "✓ Fixed buildConfig for $lib" -ForegroundColor Green
        } else {
            Write-Host "✓ $lib already has buildFeatures or no buildConfigField" -ForegroundColor Cyan
        }
    }
}

Write-Host "`nAll buildConfig fixes complete!" -ForegroundColor Green
Write-Host "Now running the app..." -ForegroundColor Yellow

# Run the app
npx react-native run-android






