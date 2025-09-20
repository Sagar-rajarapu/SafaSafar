# 🚀 SafeSafar - Quick Start Guide

## Prerequisites ✅

- ✅ Android Studio installed
- ✅ Android SDK configured
- ✅ Pixel 7 emulator detected
- ✅ Node.js and dependencies ready

## Step 1: Start Pixel 7 Emulator

1. Open **Android Studio**
2. Go to **Tools** → **AVD Manager**
3. Click **▶️ Play** button next to your Pixel 7 emulator
4. Wait for emulator to fully boot (you'll see the Android home screen)

## Step 2: Run the App

### Option A: Using the Batch File (Recommended)

```bash
# Double-click or run in terminal:
run-android.bat
```

### Option B: Using PowerShell

```powershell
.\run-android.ps1
```

### Option C: Manual Commands

```bash
# Terminal 1 - Start Metro bundler
npx react-native start

# Terminal 2 - Run on Android
npx react-native run-android
```

## Step 3: Grant Permissions

When the app launches, grant these permissions:

- ✅ **Location** - Allow for safety monitoring
- ✅ **Camera** - Allow for emergency evidence
- ✅ **Microphone** - Allow for emergency recording
- ✅ **Storage** - Allow for data storage

## Step 4: Test the App Interface

### Login Screen

- **Email**: `demo@example.com`
- **Password**: `password123`
- Click **Sign In**

### Main Dashboard

You should see:

- 🟢 **Green-themed UI** with safety focus
- 📊 **Safety Score** with risk level indicator
- 🚨 **Panic Button** (red emergency button)
- 📍 **Location Tracking** toggle
- 🗺️ **Geo-Fencing** settings
- 👤 **Profile** and **Settings** tabs

### Navigation Tabs

- **Dashboard** - Main safety overview
- **Safety Score** - Detailed risk assessment
- **Geo-Fencing** - Location zone monitoring
- **Panic Button** - Emergency features
- **Tracking** - Location history
- **Profile** - User account
- **Settings** - App configuration

## Expected App Features

### 🎯 Core Safety Features

1. **Real-time Location Tracking**
2. **Safety Score Calculation** (0-100 scale)
3. **Emergency Panic Button** with haptic feedback
4. **Geo-Fencing Alerts** for restricted zones
5. **Emergency Contact Integration**

### 🎨 UI/UX Features

- **Material Design** components
- **Smooth animations** with Reanimated
- **Responsive layout** for different screen sizes
- **Dark/Light theme** support
- **Accessibility** features

## Troubleshooting

### If App Won't Start

```bash
# Clean and rebuild
npm run clean
npm run reset
npx react-native run-android
```

### If Metro Bundler Issues

```bash
# Reset Metro cache
npx react-native start --reset-cache
```

### If Build Errors

```bash
# Clean Android build
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### If Emulator Issues

1. Restart emulator
2. Check emulator has sufficient RAM (4GB+)
3. Enable hardware acceleration
4. Check ADB connection: `adb devices`

## App Screenshots Expected

### Login Screen

- SafeSafar logo and title
- Email/password input fields
- Demo credentials displayed
- Sign In/Sign Up buttons

### Dashboard Screen

- Header with app title and location
- Safety score card with risk level
- Quick action buttons (Panic, Tracking, Geo-Fencing)
- Status indicators for location and safety
- Emergency contacts list

### Panic Button Screen

- Large red emergency button
- Status indicators
- Action buttons (Cancel/Resolve)
- Emergency contact information
- Instructions for use

## Performance Tips

1. **Emulator Settings**:

   - RAM: 4GB+
   - CPU: 4 cores
   - Graphics: Hardware acceleration
   - Storage: 8GB+

2. **App Performance**:
   - Location updates every 5 seconds
   - Smooth 60fps animations
   - Efficient memory usage
   - Background location tracking

## Support

If you encounter issues:

1. Check the console logs
2. Verify all permissions are granted
3. Ensure emulator has sufficient resources
4. Try the troubleshooting steps above

## Next Steps

Once the app is running successfully:

1. Test all navigation between screens
2. Try the panic button functionality
3. Test location tracking
4. Configure geo-fencing zones
5. Explore settings and profile options

---

**🎉 Congratulations! You now have SafeSafar running on your Pixel 7 emulator!**

