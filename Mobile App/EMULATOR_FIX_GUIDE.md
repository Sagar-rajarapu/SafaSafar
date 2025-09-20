# 🔧 Android Emulator Fix Guide

## Problem: Emulator Crashes or Won't Start

Your emulator is crashing due to common Android Studio/Emulator issues. Here's how to fix it:

## Solution 1: Fix Emulator Settings

### Step 1: Open Android Studio

1. Open **Android Studio**
2. Go to **Tools** → **AVD Manager**
3. Click **Edit** (pencil icon) next to your emulator
4. Click **Show Advanced Settings**

### Step 2: Configure Emulator Settings

Set these values:

- **RAM**: 4096 MB (4 GB)
- **VM Heap**: 512 MB
- **Internal Storage**: 8 GB
- **SD Card**: 1 GB
- **Graphics**: Software - GLES 2.0
- **Multi-Core CPU**: 4 cores
- **Hardware Acceleration**: Software

### Step 3: Save and Start

1. Click **Finish**
2. Click **▶️ Play** to start emulator
3. Wait for it to fully boot (Android home screen)

## Solution 2: Create New Emulator

If the above doesn't work, create a new emulator:

### Step 1: Create New AVD

1. **AVD Manager** → **Create Virtual Device**
2. Select **Phone** → **Pixel 7** → **Next**
3. Choose **API Level 33 (Android 13)** or **API Level 34 (Android 14)**
4. Click **Next**

### Step 2: Configure New Emulator

- **Name**: SafeSafar_Pixel7
- **RAM**: 4096 MB
- **Graphics**: Software - GLES 2.0
- **Multi-Core CPU**: 4 cores
- **Hardware Acceleration**: Software

### Step 3: Start New Emulator

1. Click **Finish**
2. Start the new emulator
3. Wait for Android home screen

## Solution 3: Manual Emulator Start

If Android Studio doesn't work, start manually:

```bash
# Open Command Prompt as Administrator
cd C:\Users\sunil\AppData\Local\Android\Sdk\emulator

# Start emulator with safe parameters
emulator -avd SafeSafar_Emulator -no-audio -gpu swiftshader_indirect -memory 4096
```

## Solution 4: Alternative - Use Physical Device

If emulator keeps crashing:

1. **Enable Developer Options** on your Android phone:

   - Go to **Settings** → **About Phone**
   - Tap **Build Number** 7 times
   - Go back to **Settings** → **Developer Options**
   - Enable **USB Debugging**

2. **Connect Phone via USB**
3. **Run the app**:
   ```bash
   npx react-native run-android
   ```

## Solution 5: Fix Emulator Issues

### Clear Emulator Data

```bash
# Delete emulator data
rmdir /s "C:\Users\sunil\.android\avd\SafeSafar_Emulator.avd"

# Or reset emulator in Android Studio
# AVD Manager → Edit → Wipe Data
```

### Update Android Studio

1. **Help** → **Check for Updates**
2. Update to latest version
3. Update Android SDK Tools

## Quick Fix Script

Run this batch file to automatically fix emulator:

```bash
# Double-click this file:
fix-emulator.bat
```

## After Emulator is Running

Once emulator is working:

```bash
# Check if emulator is connected
adb devices

# Should show:
# emulator-5554   device

# Then run the app
npx react-native run-android
```

## Expected Result

You should see:

- ✅ Emulator starts successfully
- ✅ Android home screen appears
- ✅ SafeSafar app installs and launches
- ✅ Green-themed safety app interface
- ✅ Login screen with demo credentials

## Troubleshooting

### If Emulator Still Crashes

1. **Restart computer**
2. **Update graphics drivers**
3. **Disable antivirus temporarily**
4. **Run Android Studio as Administrator**

### If App Won't Install

1. **Check emulator is running**: `adb devices`
2. **Clean build**: `npm run clean`
3. **Reset Metro**: `npm run reset`
4. **Try again**: `npx react-native run-android`

### If App Crashes on Launch

1. **Check Metro bundler is running**
2. **Grant all permissions** in emulator
3. **Check console logs** for errors

## Success Indicators

✅ **Emulator running**: Android home screen visible
✅ **ADB connected**: `adb devices` shows emulator
✅ **App installed**: SafeSafar icon in app drawer
✅ **App launches**: Green safety interface appears
✅ **Login works**: Can login with demo credentials

---

**Need Help?** If none of these solutions work, try using a physical Android device instead of the emulator.

