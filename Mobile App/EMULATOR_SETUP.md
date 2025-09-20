# SafeSafar - Android Emulator Setup Guide

## Prerequisites

1. **Android Studio** (latest version)
2. **Node.js** (v16 or higher)
3. **Java Development Kit (JDK)** 11 or higher
4. **React Native CLI** or **Expo CLI**

## Step 1: Install Dependencies

```bash
# Install project dependencies
npm install

# For iOS (if on macOS)
cd ios && pod install && cd ..
```

## Step 2: Set up Android Emulator

### Create Pixel 7 Emulator

1. Open **Android Studio**
2. Go to **Tools** → **AVD Manager**
3. Click **Create Virtual Device**
4. Select **Phone** → **Pixel 7** → **Next**
5. Choose **API Level 34 (Android 14)** or **API Level 33 (Android 13)**
6. Click **Next** → **Finish**

### Configure Emulator Settings

1. In AVD Manager, click **Edit** (pencil icon) next to your Pixel 7 emulator
2. Click **Show Advanced Settings**
3. Set the following:
   - **RAM**: 4 GB or higher
   - **Internal Storage**: 8 GB or higher
   - **SD Card**: 1 GB
4. Click **Finish**

## Step 3: Start the Emulator

1. Start your Pixel 7 emulator from AVD Manager
2. Wait for it to fully boot up
3. Enable **Developer Options** and **USB Debugging** (if not already enabled)

## Step 4: Run the App

### Method 1: Using React Native CLI

```bash
# Start Metro bundler
npx react-native start

# In a new terminal, run on Android
npx react-native run-android
```

### Method 2: Using Android Studio

1. Open the project in Android Studio
2. Select your Pixel 7 emulator as the target device
3. Click **Run** (green play button)

## Step 5: Grant Permissions

When the app launches, you'll need to grant permissions:

1. **Location Permission**: Allow location access for safety monitoring
2. **Camera Permission**: Allow camera access for emergency evidence
3. **Microphone Permission**: Allow microphone access for emergency recording
4. **Storage Permission**: Allow storage access for saving data

## Troubleshooting

### Common Issues

1. **Metro bundler not starting**:

   ```bash
   npx react-native start --reset-cache
   ```

2. **Build errors**:

   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

3. **Emulator not detected**:

   - Ensure emulator is running
   - Check `adb devices` to see connected devices
   - Restart ADB: `adb kill-server && adb start-server`

4. **Permission issues**:
   - Go to Settings → Apps → SafeSafar → Permissions
   - Enable all required permissions

### Performance Optimization

1. **Enable Hardware Acceleration**:

   - In AVD Manager → Edit → Advanced Settings
   - Set **Graphics** to **Hardware - GLES 2.0**

2. **Increase Emulator Performance**:
   - Allocate more RAM (4GB+)
   - Enable **Use Host GPU**
   - Set **Multi-Core CPU** to 4 cores

## App Features to Test

1. **Login Screen**: Use demo credentials (demo@example.com / password123)
2. **Dashboard**: View safety score and quick actions
3. **Panic Button**: Test emergency functionality
4. **Location Tracking**: Verify GPS functionality
5. **Geo-Fencing**: Test zone alerts
6. **Safety Score**: View risk assessment
7. **Settings**: Configure app preferences

## Expected App Interface

The app should display:

- **Green-themed UI** for safety
- **Material Design** components
- **Tab navigation** at the bottom
- **Real-time location** updates
- **Emergency panic button** (red when active)
- **Safety score** with risk indicators

## Support

If you encounter issues:

1. Check the Metro bundler logs
2. Check Android Studio logs
3. Verify all permissions are granted
4. Ensure emulator has sufficient resources

