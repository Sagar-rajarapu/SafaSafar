# SafeSafar - Smart Tourist Safety Platform

A comprehensive real-time safety monitoring and emergency response system designed for tourists and authorities in India. SafeSafar provides location tracking, emergency alerts, and safety zone management to ensure secure travel experiences.

## 🚀 Features

### For Tourists
- **Real-time Location Tracking**: Share your location with authorities for safety monitoring
- **Emergency Alert System**: Quick access to emergency buttons for panic, medical, theft, harassment, and other incidents
- **Interactive Safety Map**: View your location and nearby safety information using Mapbox integration
- **Safety Status Dashboard**: Monitor current safety levels and active alerts in your area
- **Emergency Contacts**: Quick access to police (100), tourist helpline (1363), and medical emergency (108)

### For Authorities
- **Safety Zone Management**: Create and manage designated safe areas for tourists
- **Real-time Monitoring**: Track tourist locations and emergency alerts
- **Alert Management**: Respond to and manage emergency situations
- **Dashboard Analytics**: View safety statistics and incident reports

### For Police
- **Emergency Response**: Handle and respond to emergency alerts from tourists
- **Location Tracking**: Monitor tourist locations and safety zones
- **Alert Management**: Acknowledge and resolve emergency situations
- **Incident Reports**: Track and manage safety incidents

## 🛠️ Tech Stack

### Frontend (React + Vite)
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS
- **Maps**: Mapbox GL JS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Icons**: Lucide React

### Backend (Node.js + Express)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Supabase
- **Authentication**: JWT + Supabase Auth
- **Blockchain**: Hyperledger Fabric integration
- **File Upload**: Multer
- **Email**: Nodemailer

### Mobile App (React Native)
- **Mobile**: React Native
- **Platform**: Android (iOS support planned)
- **Maps**: React Native Maps
- **Location**: GPS tracking
- **Push Notifications**: Firebase (planned)

### Database & Infrastructure
- **Primary Database**: Supabase (PostgreSQL)
- **Secondary Database**: MongoDB
- **Blockchain**: Hyperledger Fabric
- **File Storage**: Supabase Storage
- **Authentication**: Supabase Auth

## 🏗️ Project Structure

```
SafeSafarNative/
├── frontend/                 # React + Vite web application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── integrations/   # Supabase integration
│   │   └── lib/            # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js + Express API server
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── models/             # Database models
│   ├── config/             # Configuration files
│   ├── chaincode/          # Hyperledger Fabric chaincode
│   └── server.js           # Main server file
├── Mobile App/             # React Native mobile application
│   ├── android/            # Android-specific code
│   └── src/                # React Native source code
├── supabase/               # Database migrations and config
│   ├── migrations/         # SQL migration files
│   └── config.toml         # Supabase configuration
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Android Studio (for mobile development)
- Supabase account
- MongoDB (for backend)
- Hyperledger Fabric (for blockchain features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SafeSafarNative
   ```

2. **Install dependencies for all components**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..

   # Install backend dependencies
   cd backend
   npm install
   cd ..

   # Install mobile app dependencies
   cd "Mobile App"
   npm install
   cd ..
   ```

3. **Set up environment variables**

   **Frontend (.env.local)**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
   ```

   **Backend (.env)**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=5000
   ```

   **Mobile App (.env)**
   ```env
   REACT_NATIVE_SUPABASE_URL=your_supabase_url
   REACT_NATIVE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration files in the `supabase/migrations/` directory
   - Configure authentication settings
   - Set up Row Level Security (RLS) policies

5. **Set up MongoDB**
   - Create a MongoDB Atlas account or local MongoDB instance
   - Update the connection string in backend/.env

6. **Set up Hyperledger Fabric** (Optional)
   - Follow Hyperledger Fabric setup guide
   - Configure network settings in backend/config/

## 🚀 Running the Application

### Development Mode

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Start the Mobile App** (Android)
   ```bash
   cd "Mobile App"
   npx react-native run-android
   ```

### Production Mode

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start Backend in Production**
   ```bash
   cd backend
   npm start
   ```

3. **Build Mobile App**
   ```bash
   cd "Mobile App"
   npx react-native build-android --mode=release
   ```

## 📱 User Types & Access

### Tourist Dashboard
- **Web**: Access via `/tourist` route
- **Mobile**: Main app interface
- **Features**: Location sharing, emergency alerts, safety map, emergency contacts

### Authority Dashboard  
- **Web**: Access via `/authority` route
- **Features**: Safety zone management, tourist monitoring, alert management

### Police Dashboard
- **Web**: Access via `/police` route
- **Features**: Emergency response, location tracking, incident management

## 🗄️ Database Schema

### Supabase Tables
- `profiles`: User profile information
- `emergency_alerts`: Emergency alert records
- `safety_zones`: Designated safe areas
- `user_locations`: Real-time location tracking

### MongoDB Collections
- `users`: Extended user information
- `tourists`: Tourist-specific data
- `authorities`: Authority user data
- `incidents`: Incident reports and logs

## 🔧 Configuration

### Mapbox Setup
1. Create a Mapbox account
2. Generate an access token
3. Add the token to your environment variables

### Supabase Setup
1. Create a new Supabase project
2. Run the provided migration files
3. Configure authentication providers
4. Set up Row Level Security (RLS) policies

### Android Development Setup
1. Install Android Studio
2. Set up Android SDK
3. Configure emulator or connect physical device
4. Run `npx react-native doctor` to verify setup

## 🚀 Deployment

### Frontend Deployment
- **Vercel**: Connect GitHub repository
- **Netlify**: Deploy from build folder
- **AWS S3**: Upload build files

### Backend Deployment
- **Heroku**: Connect GitHub repository
- **AWS EC2**: Deploy with PM2
- **DigitalOcean**: Deploy with Docker

### Mobile App Deployment
- **Google Play Store**: Build release APK
- **Internal Distribution**: Use Firebase App Distribution

## 🔒 Security Features

- **JWT Authentication**: Secure API access
- **Row Level Security**: Database-level security
- **Location Encryption**: Secure location data transmission
- **Emergency Encryption**: Encrypted emergency communications
- **Blockchain Verification**: Immutable incident records

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Emergency Alerts
- `POST /api/emergency/alert` - Create emergency alert
- `GET /api/emergency/alerts` - Get user alerts
- `PUT /api/emergency/alert/:id` - Update alert status

### Safety Zones
- `GET /api/safety-zones` - Get safety zones
- `POST /api/safety-zones` - Create safety zone
- `PUT /api/safety-zones/:id` - Update safety zone

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test
```

### Backend Testing
```bash
cd backend
npm test
```

### Mobile App Testing
```bash
cd "Mobile App"
npx react-native test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the SafeSafar development team
- Email: XXXXXXXXXX

## 🙏 Acknowledgments

- Mapbox for mapping services
- Supabase for backend infrastructure
- React Native community for mobile development
- Hyperledger Fabric for blockchain integration

---

**SafeSafar** - Making tourism safer, one journey at a time. 🛡️

*Built with ❤️ for safer travels in India*
