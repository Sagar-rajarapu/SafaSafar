import { AlertTriangle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface EmergencyButtonProps {
  variant?: "default" | "compact";
}

export const EmergencyButton = ({ variant = "default" }: EmergencyButtonProps) => {
  const [isActivating, setIsActivating] = useState(false);

  const handleEmergency = () => {
    setIsActivating(true);
    toast({
      title: "Emergency Alert Activated",
      description: "Your location has been shared with nearby authorities. Help is on the way.",
      variant: "destructive",
    });
    
    // Simulate emergency activation
    setTimeout(() => {
      setIsActivating(false);
    }, 3000);
  };

  if (variant === "compact") {
    return (
      <Button
        onClick={handleEmergency}
        disabled={isActivating}
        className="bg-gradient-emergency hover:bg-emergency/90 text-emergency-foreground shadow-emergency border-0 h-12 px-6"
      >
        <AlertTriangle className="w-5 h-5 mr-2" />
        {isActivating ? "Alerting..." : "Emergency"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        onClick={handleEmergency}
        disabled={isActivating}
        size="lg"
        className="bg-gradient-emergency hover:bg-emergency/90 text-emergency-foreground shadow-emergency border-0 h-16 px-8 text-lg font-semibold rounded-xl"
      >
        <AlertTriangle className="w-6 h-6 mr-3" />
        {isActivating ? "Activating Emergency Alert..." : "Emergency Alert"}
      </Button>
      
      <div className="flex space-x-4 text-sm text-muted-foreground">
        <span className="flex items-center">
          <Phone className="w-4 h-4 mr-1" />
          Police: 100
        </span>
        <span>Tourist Helpline: 1363</span>
      </div>
    </div>
  );
};