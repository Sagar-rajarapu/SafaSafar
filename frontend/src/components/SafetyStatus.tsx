import { Shield, MapPin, Users, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SafetyStatusProps {
  currentLocation?: string;
  safetyLevel: "safe" | "moderate" | "high-risk";
  touristCount: number;
  activeAlerts: number;
}

export const SafetyStatus = ({ 
  currentLocation = "Shillong, Meghalaya", 
  safetyLevel, 
  touristCount, 
  activeAlerts 
}: SafetyStatusProps) => {
  const getSafetyColor = () => {
    switch (safetyLevel) {
      case "safe":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
      case "moderate":
        return "bg-amber-500/10 text-amber-700 border-amber-200";
      case "high-risk":
        return "bg-red-500/10 text-red-700 border-red-200";
      default:
        return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    }
  };

  const getSafetyText = () => {
    switch (safetyLevel) {
      case "safe":
        return "Safe";
      case "moderate":
        return "Moderate Risk";
      case "high-risk":
        return "High Risk";
      default:
        return "Safe";
    }
  };

  return (
    <Card className="w-full shadow-soft border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" />
            Safety Status
          </CardTitle>
          <Badge 
            className={getSafetyColor()}
          >
            {getSafetyText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-foreground">
          <MapPin className="w-4 h-4 mr-2 text-primary" />
          <span className="font-medium">Current Location:</span>
          <span className="ml-2">{currentLocation}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-primary" />
            <span>{touristCount} tourists nearby</span>
          </div>
          
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-warning" />
            <span>{activeAlerts} active alerts</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Real-time safety monitoring active. Your location is being tracked for emergency response.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};