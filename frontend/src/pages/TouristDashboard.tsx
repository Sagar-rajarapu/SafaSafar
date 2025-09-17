import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, User, Phone, Settings, MapPin, Navigation, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { SafetyStatus } from "@/components/SafetyStatus";
import { EmergencyButton } from "@/components/EmergencyButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import MapComponent from "@/components/MapComponent";
import { useLocation } from "@/hooks/useLocation";
import { useEmergencyAlerts } from "@/hooks/useEmergencyAlerts";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export const TouristDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentLocation, 
    isTracking, 
    isLocationEnabled, 
    startTracking, 
    stopTracking, 
    requestLocationPermission 
  } = useLocation();
  const { alerts, activeAlertsCount, createAlert } = useEmergencyAlerts();
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleLocationSharingToggle = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        setLocationSharingEnabled(true);
        startTracking();
      }
    } else {
      setLocationSharingEnabled(false);
      stopTracking();
    }
  };

  const handleEmergencyAlert = async (type: 'panic' | 'medical' | 'theft' | 'harassment' | 'other' = 'panic') => {
    await createAlert(type, `Emergency alert triggered by tourist`);
  };

  if (!user) {
    return null; // Will redirect via useEffect
  }
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to SafeSafar
          </h1>
          <p className="text-muted-foreground">
            Your safety companion for secure travel
          </p>
        </div>

        {/* Safety Status */}
        <SafetyStatus 
          safetyLevel={activeAlertsCount > 0 ? "high-risk" : "safe"}
          touristCount={47}
          activeAlerts={activeAlertsCount}
          currentLocation={currentLocation ? `Lat: ${currentLocation.latitude.toFixed(4)}, Lng: ${currentLocation.longitude.toFixed(4)}` : "Location unavailable"}
        />

        {/* Location Controls */}
        <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              Location Services
            </CardTitle>
            <CardDescription>
              Control your location sharing and tracking preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Location Sharing</Label>
                <div className="text-sm text-muted-foreground">
                  Share your location with authorities for safety monitoring
                </div>
              </div>
              <Switch
                checked={locationSharingEnabled}
                onCheckedChange={handleLocationSharingToggle}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm">
                <span className="font-medium">Status: </span>
                <Badge variant={isTracking ? "default" : "secondary"}>
                  {isTracking ? "Tracking" : "Not Tracking"}
                </Badge>
              </div>
              <div className="text-sm">
                <span className="font-medium">Permission: </span>
                <Badge variant={isLocationEnabled ? "default" : "destructive"}>
                  {isLocationEnabled ? "Granted" : "Denied"}
                </Badge>
              </div>
            </div>

            {currentLocation && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                Current: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                {currentLocation.accuracy && ` (±${currentLocation.accuracy.toFixed(0)}m)`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interactive Map */}
        <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Navigation className="w-5 h-5 mr-2 text-primary" />
              Safety Map
            </CardTitle>
            <CardDescription>
              Real-time map showing your location and nearby safety information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <MapComponent 
                onLocationUpdate={(lat, lng) => {
                  console.log('Location selected:', lat, lng);
                }}
                emergencyAlerts={alerts.map(alert => ({
                  id: alert.id,
                  latitude: alert.latitude,
                  longitude: alert.longitude,
                  alert_type: alert.alert_type,
                  status: alert.status,
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                Navigation
              </CardTitle>
              <CardDescription>
                Find safe routes and nearby attractions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-primary hover:bg-primary/90">
                <Navigation className="w-4 h-4 mr-2" />
                Open Map
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-warning" />
                Safety Alerts
              </CardTitle>
              <CardDescription>
                View current safety notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Alerts</span>
                  <Badge className="bg-warning/10 text-warning border-warning/20">
                    2 New
                  </Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                View All Alerts
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Phone className="w-5 h-5 mr-2 text-primary" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>
                Quick access to help services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div>Police: 100</div>
                <div>Tourist Helpline: 1363</div>
                <div>Medical Emergency: 108</div>
              </div>
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Manage Contacts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Button */}
        <div className="flex justify-center">
          <div className="text-center">
            <Button
              onClick={() => handleEmergencyAlert('panic')}
              className="bg-gradient-emergency hover:bg-emergency/90 text-emergency-foreground shadow-emergency border-0 h-16 px-8 text-lg font-semibold rounded-xl mb-4"
            >
              <AlertCircle className="w-6 h-6 mr-3" />
              Emergency Alert
            </Button>
            
            <div className="flex space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                Police: 100
              </span>
              <span>Tourist Helpline: 1363</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Emergency Alerts History</CardTitle>
            <CardDescription>
              Your recent emergency activities and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.status === 'active' ? 'bg-emergency' :
                      alert.status === 'acknowledged' ? 'bg-warning' :
                      'bg-safety'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {alert.alert_type.charAt(0).toUpperCase() + alert.alert_type.slice(1)} Alert
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {alert.status} • {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={
                      alert.status === 'active' ? 'destructive' :
                      alert.status === 'acknowledged' ? 'default' :
                      'secondary'
                    }>
                      {alert.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No emergency alerts</p>
                  <p className="text-xs">Stay safe during your travels</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};