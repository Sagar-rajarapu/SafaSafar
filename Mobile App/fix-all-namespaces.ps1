# Fix all React Native library namespace issues for Gradle 8.0
Write-Host "Fixing namespace issues for all React Native libraries..." -ForegroundColor Green

# List of libraries and their namespaces
$libraries = @(
    @{name="react-native-vector-icons"; namespace="com.oblador.vectoricons"},
    @{name="react-native-haptic-feedback"; namespace="com.mkuczera.RNReactNativeHapticFeedback"},
    @{name="react-native-flash-message"; namespace="com.xyz.reactnativeflashmessage"},
    @{name="react-native-chart-kit"; namespace="com.reactnativecommunity.chartkit"},
    @{name="react-native-svg"; namespace="com.horcrux.svg"},
    @{name="react-native-safe-area-context"; namespace="com.th3rdwave.safeareacontext"},
    @{name="react-native-screens"; namespace="com.swmansion.rnscreens"},
    @{name="react-native-gesture-handler"; namespace="com.swmansion.gesturehandler"}
)

foreach ($lib in $libraries) {
    $buildGradlePath = "node_modules\$($lib.name)\android\build.gradle"
    
    if (Test-Path $buildGradlePath) {
        Write-Host "Fixing $($lib.name)..." -ForegroundColor Yellow
        
        # Read the file
        $content = Get-Content $buildGradlePath -Raw
        
        # Check if namespace already exists
        if ($content -notmatch "namespace\s+'") {
            # Add namespace after android {
            $content = $content -replace "(android\s*\{)", "`$1`n    namespace '$($lib.namespace)'"
            
            # Write back to file
            Set-Content $buildGradlePath $content -NoNewline
            Write-Host "✓ Added namespace to $($lib.name)" -ForegroundColor Green
        } else {
            Write-Host "✓ $($lib.name) already has namespace" -ForegroundColor Cyan
        }
    } else {
        Write-Host "⚠ $($lib.name) not found" -ForegroundColor Red
    }
}

Write-Host "`nAll namespace fixes complete!" -ForegroundColor Green
Write-Host "Now running the app..." -ForegroundColor Yellow

# Run the app
npx react-native run-android






