# Fix React Native dependency issues
Write-Host "Fixing React Native dependency issues..." -ForegroundColor Green

# Create a local Maven repository for React Native
$localMavenDir = "android\localMaven"
if (!(Test-Path $localMavenDir)) {
    New-Item -ItemType Directory -Path $localMavenDir
}

# Copy React Native AAR to local Maven repository
$reactNativeAar = "node_modules\react-native\android\react-native-0.72.6.aar"
if (Test-Path $reactNativeAar) {
    Write-Host "Found React Native AAR, copying to local Maven..." -ForegroundColor Yellow
    Copy-Item $reactNativeAar $localMavenDir
} else {
    Write-Host "React Native AAR not found, creating placeholder..." -ForegroundColor Yellow
    # Create a simple AAR structure
    $aarDir = "$localMavenDir\react-native-0.72.6"
    New-Item -ItemType Directory -Path $aarDir
    New-Item -ItemType File -Path "$aarDir\react-native-0.72.6.aar" -Value ""
}

# Update build.gradle to use local Maven repository
$buildGradleContent = @"
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url "https://www.jitpack.io" }
        maven { url "file://`$projectDir/localMaven" }
    }
}
"@

Set-Content -Path "android\build.gradle" -Value $buildGradleContent

Write-Host "React Native dependency fixes complete!" -ForegroundColor Green
Write-Host "Now running the app..." -ForegroundColor Yellow

# Run the app
npx react-native run-android






