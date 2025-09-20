# SafeSafar - Smart Tourist Safety Monitoring & Incident Response System

A comprehensive React Native mobile application that provides AI-powered safety monitoring, real-time location tracking, and emergency response features for tourists in high-risk areas.

## Features

### 🛡️ Core Safety Features

- **AI-Powered Safety Score**: Dynamic risk assessment based on location, time, behavior patterns, and environmental factors
- **Panic Button**: One-touch emergency activation with multi-channel alerts
- **Geo-fencing**: Real-time monitoring of restricted and high-risk zones
- **Location Tracking**: Optional real-time location sharing with privacy controls

### 📱 User Interface

- **Modern UI**: Clean, intuitive interface with React Native Paper components
- **Multilingual Support**: Support for 10+ Indian languages
- **Accessibility**: Voice commands and large text options for elderly users
- **Dark/Light Theme**: Customizable theme preferences

### 🔒 Security & Privacy

- **End-to-end Encryption**: All communications are encrypted
- **Privacy Controls**: Granular control over data sharing
- **Secure Storage**: Sensitive data stored using React Native Keychain
- **GDPR Compliance**: Full compliance with data protection laws

## Technology Stack

- **Frontend**: React Native 0.72.6
- **UI Library**: React Native Paper
- **Navigation**: React Navigation 6
- **Maps**: React Native Maps
- **Charts**: React Native Chart Kit
- **Storage**: AsyncStorage, React Native Keychain
- **Location**: React Native Geolocation Service
- **State Management**: React Hooks
- **TypeScript**: Full TypeScript support

## Installation

### Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd SafeSafar
```

2. Install dependencies:

```bash
npm install
```

3. For iOS, install pods:

```bash
cd ios && pod install && cd ..
```

4. Run the application:

```bash
# Android
npm run android

# iOS
npm run ios
```

## Project Structure

```
SafeSafar/
├── src/
│   ├── screens/           # Screen components
│   │   ├── DashboardScreen.tsx
│   │   ├── SafetyScoreScreen.tsx
│   │   ├── PanicButtonScreen.tsx
│   │   ├── GeoFencingScreen.tsx
│   │   ├── TrackingScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/          # Business logic services
│   │   ├── AuthService.ts
│   │   ├── LocationService.ts
│   │   ├── SafetyScoreService.ts
│   │   ├── PanicButtonService.ts
│   │   ├── GeoFencingService.ts
│   │   └── TrackingService.ts
│   └── styles/            # Theme and styling
│       └── theme.ts
├── App.tsx                # Main app component
├── package.json           # Dependencies
└── README.md             # This file
```

## Key Components

### Safety Score Algorithm

The safety score is calculated using multiple factors:

- **Location Risk** (30%): Based on proximity to high-risk zones
- **Time Risk** (20%): Time of day and seasonal factors
- **Movement Pattern** (15%): Speed and movement behavior
- **Historical Behavior** (20%): Past safety record and patterns
- **Environmental Risk** (15%): Weather, crime data, and other factors

### Geo-fencing System

- Pre-defined high-risk zones (caves, forests, restricted areas)
- Real-time GPS monitoring with configurable radius
- Automatic alerts when entering/exiting zones
- Customizable alert preferences

### Panic Button

- One-touch emergency activation
- Multi-channel alerts (Police, Emergency contacts, Tourism dept)
- Live location sharing
- Audio/video evidence capture
- Automated E-FIR generation

### Location Tracking

- Optional real-time GPS tracking
- Privacy controls for data sharing
- Family access portal
- Law enforcement access (with consent)
- Export/import tracking data

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```
API_BASE_URL=https://api.safesafar.com
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
BLOCKCHAIN_NODE_URL=https://blockchain.safesafar.com
```

### Permissions

The app requires the following permissions:

- Location (Fine and Coarse)
- Camera
- Microphone
- Storage
- Phone (for emergency calls)

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
cd ios && xcodebuild -workspace SafeSafar.xcworkspace -scheme SafeSafar -configuration Release
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Email: support@safesafar.com
- Documentation: https://docs.safesafar.com
- Issues: GitHub Issues

## Roadmap

- [ ] Blockchain integration for digital IDs
- [ ] IoT device integration (smart bands)
- [ ] AI anomaly detection improvements
- [ ] Offline functionality
- [ ] Push notifications
- [ ] Web dashboard for authorities
- [ ] Multi-language voice support
- [ ] Advanced analytics and reporting

## Acknowledgments

- React Native community
- React Native Paper team
- Open source contributors
- Tourism safety experts
- Law enforcement agencies
