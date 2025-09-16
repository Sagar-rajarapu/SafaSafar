import { User, Shield, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserTypeSelectorProps {
  onSelect: (type: "tourist" | "authority" | "police") => void;
}

export const UserTypeSelector = ({ onSelect }: UserTypeSelectorProps) => {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      <Card className="cursor-pointer transition-all hover:shadow-soft border-2 hover:border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Tourist Access</CardTitle>
          <CardDescription>
            Safe travel monitoring and emergency assistance
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Button 
            onClick={() => onSelect("tourist")}
            className="w-full bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-soft border-0"
            size="lg"
          >
            Access Tourist Dashboard
          </Button>
          
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
              Real-time location monitoring
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
              Emergency alert system
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
              Safety zone notifications
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer transition-all hover:shadow-soft border-2 hover:border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">Authority Access</CardTitle>
          <CardDescription>
            Monitor tourists and manage emergency responses
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Button 
            onClick={() => onSelect("authority")}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-700 border border-red-200"
            size="lg"
          >
            Access Authority Dashboard
          </Button>
          
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              Real-time tourist monitoring
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              Incident management system
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              Emergency response coordination
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer transition-all hover:shadow-soft border-2 hover:border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BadgeCheck className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Police Access</CardTitle>
          <CardDescription>
            Minimalistic interface for law enforcement
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Button 
            onClick={() => onSelect("police")}
            className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 border border-blue-200"
            size="lg"
          >
            Access Police Dashboard
          </Button>
          
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Live tourist tracking
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Emergency alert response
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Quick action controls
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};