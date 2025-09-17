import { TrendingUp, Users, MapPin, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  colorScheme: "primary" | "safety" | "warning" | "emergency";
}

const StatCard = ({ title, value, subtitle, icon, trend, colorScheme }: StatCardProps) => {
  const getIconBgClass = () => {
    switch (colorScheme) {
      case "primary": return "bg-primary/10";
      case "safety": return "bg-emerald-500/10";
      case "warning": return "bg-amber-500/10";
      case "emergency": return "bg-red-500/10";
      default: return "bg-primary/10";
    }
  };

  return (
    <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${getIconBgClass()}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {trend && (
            <TrendingUp className={`w-3 h-3 mr-1 ${
              trend === "up" ? "text-emerald-500" : 
              trend === "down" ? "text-red-500" : 
              "text-muted-foreground"
            }`} />
          )}
          {subtitle}
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Active Tourists"
        value="1,247"
        subtitle="Currently monitored"
        icon={<Users className="h-4 w-4 text-primary" />}
        trend="up"
        colorScheme="primary"
      />
      
      <StatCard
        title="Safety Score"
        value="92%"
        subtitle="Above average"
        icon={<MapPin className="h-4 w-4 text-safety" />}
        trend="up"
        colorScheme="safety"
      />
      
      <StatCard
        title="Active Alerts"
        value="3"
        subtitle="Moderate priority"
        icon={<AlertTriangle className="h-4 w-4 text-warning" />}
        trend="neutral"
        colorScheme="warning"
      />
      
      <StatCard
        title="Response Time"
        value="2.4 min"
        subtitle="Average emergency response"
        icon={<TrendingUp className="h-4 w-4 text-emergency" />}
        trend="up"
        colorScheme="emergency"
      />
    </div>
  );
};