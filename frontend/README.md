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

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS
- **Maps**: Mapbox GL JS
- **Backend**: Supabase (Authentication + Database)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd safetour-guardian-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration files in the `supabase/migrations/` directory
   - Configure authentication settings

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:8080`

## 📱 User Types

### Tourist Dashboard
- Access via `/tourist` route
- Location sharing controls
- Emergency alert system
- Interactive safety map
- Emergency contacts

### Authority Dashboard  
- Access via `/authority` route
- Safety zone management
- Tourist monitoring
- Alert management

### Police Dashboard
- Access via `/police` route
- Emergency response tools
- Location tracking
- Incident management

## 🗄️ Database Schema

The application uses Supabase with the following main tables:
- `profiles`: User profile information
- `emergency_alerts`: Emergency alert records
- `safety_zones`: Designated safe areas
- `user_locations`: Real-time location tracking

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel/Netlify
The application can be deployed to any static hosting service that supports React applications.

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

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please contact the SafeSafar team or create an issue in the repository.

---

**SafeSafar** - Making tourism safer, one journey at a time. 🛡️