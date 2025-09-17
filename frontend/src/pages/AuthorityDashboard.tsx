import { Users, MapPin, AlertTriangle, FileText, Activity, Filter, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { DashboardStats } from "@/components/DashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MapComponent from "@/components/MapComponent";
import { useEmergencyAlerts } from "@/hooks/useEmergencyAlerts";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface TouristLocation {
  id: string;
  latitude: number;
  longitude: number;
  user_id: string;
  timestamp: string;
}

export const AuthorityDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { alerts, acknowledgeAlert, resolveAlert, activeAlertsCount } = useEmergencyAlerts();
  const [touristLocations, setTouristLocations] = useState<TouristLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch tourist locations
  const fetchTouristLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTouristLocations(data || []);
    } catch (error) {
      console.error('Error fetching tourist locations:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTouristLocations();
    }
  }, [user]);

  // Set up real-time subscription for locations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tourist-locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
        },
        (payload) => {
          console.log('New location update:', payload);
          fetchTouristLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header showEmergencyButton={false} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Authority Control Center
          </h1>
          <p className="text-muted-foreground">
            Real-time tourist monitoring and incident management
          </p>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Dashboard Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Real-Time Map */}
          <Card className="lg:col-span-2 shadow-soft border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                Real-Time Tourist Map
              </CardTitle>
              <CardDescription>
                Live tracking of tourist locations and safety zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <MapComponent 
                  emergencyAlerts={alerts.map(alert => ({
                    id: alert.id,
                    latitude: alert.latitude,
                    longitude: alert.longitude,
                    alert_type: alert.alert_type,
                    status: alert.status,
                  }))}
                  touristLocations={touristLocations.map(location => ({
                    id: location.id,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    user_id: location.user_id,
                  }))}
                  showControls={true}
                />
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="outline" size="sm" onClick={fetchTouristLocations}>
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
                <div className="text-sm text-muted-foreground">
                  {isLoadingLocations ? 'Loading...' : `${touristLocations.length} locations • ${activeAlertsCount} active alerts`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
                Active Alerts
              </CardTitle>
              <CardDescription>
                Current incidents requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length > 0 ? (
                  alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="border-l-4 border-emergency pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`${
                          alert.status === 'active' ? 'bg-emergency/10 text-emergency border-emergency/20' :
                          alert.status === 'acknowledged' ? 'bg-warning/10 text-warning border-warning/20' :
                          'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {alert.status === 'active' ? 'High Priority' : 
                           alert.status === 'acknowledged' ? 'Acknowledged' : 'Resolved'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        {alert.alert_type.charAt(0).toUpperCase() + alert.alert_type.slice(1)} Alert
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Location: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                      </p>
                      {alert.status === 'active' && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => resolveAlert(alert.id)}
                            className="bg-gradient-primary hover:bg-primary/90"
                          >
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No active alerts</p>
                    <p className="text-xs">All clear in your monitoring area</p>
                  </div>
                )}
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                View All Alerts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Incidents & Reports */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Recent Incidents
              </CardTitle>
              <CardDescription>
                Latest incident reports and resolutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-safety rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Medical assistance provided</p>
                    <p className="text-xs text-muted-foreground">Tourist treated for minor injury - Ward's Lake</p>
                    <p className="text-xs text-muted-foreground">Resolved • 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Lost tourist located</p>
                    <p className="text-xs text-muted-foreground">Found safe in Laitlum Canyons area</p>
                    <p className="text-xs text-muted-foreground">Resolved • 4 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Safety zone violation</p>
                    <p className="text-xs text-muted-foreground">Tourist entered restricted area - Elephant Falls</p>
                    <p className="text-xs text-muted-foreground">Resolved • Yesterday</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Tourist Management
              </CardTitle>
              <CardDescription>
                Quick actions for tourist assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start bg-gradient-emergency hover:bg-emergency/90 text-emergency-foreground">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Send Emergency Alert
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Generate E-FIR Report
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="w-4 h-4 mr-2" />
                Update Safety Zones
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Bulk Message Tourists
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};