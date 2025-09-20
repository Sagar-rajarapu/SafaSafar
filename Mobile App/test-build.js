const {execSync} = require('child_process');
const fs = require('fs');

console.log('🔍 Testing SafeSafar build process...\n');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('❌ node_modules not found. Running npm install...');
  try {
    execSync('npm install', {stdio: 'inherit'});
    console.log('✅ npm install completed');
  } catch (error) {
    console.error('❌ npm install failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ node_modules found');
}

// Check if Android SDK is available
try {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!androidHome) {
    console.log('⚠️  ANDROID_HOME not set. Please set Android SDK path.');
  } else {
    console.log('✅ Android SDK found at:', androidHome);
  }
} catch (error) {
  console.log('⚠️  Android SDK check failed');
}

// Check if emulator is running
try {
  const devices = execSync('adb devices', {encoding: 'utf8'});
  if (devices.includes('emulator')) {
    console.log('✅ Android emulator detected');
  } else {
    console.log('⚠️  No Android emulator running. Please start an emulator.');
  }
} catch (error) {
  console.log('⚠️  ADB not available or no devices connected');
}

console.log('\n🚀 Ready to build! Run one of these commands:');
console.log('   Windows: run-android.bat');
console.log('   PowerShell: .\\run-android.ps1');
console.log('   Manual: npx react-native run-android');
console.log('\n📱 Make sure your Pixel 7 emulator is running first!');

