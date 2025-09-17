import { Shield, Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmergencyButton } from "./EmergencyButton";

interface HeaderProps {
  showEmergencyButton?: boolean;
}

export const Header = ({ showEmergencyButton = true }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                SafeSafar
              </h1>
              <p className="text-xs text-muted-foreground">Tourist Safety Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" className="text-foreground hover:text-primary">
            Dashboard
          </Button>
          <Button variant="ghost" className="text-foreground hover:text-primary">
            Safety Zones
          </Button>
          <Button variant="ghost" className="text-foreground hover:text-primary">
            Reports
          </Button>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="outline" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-emergency text-emergency-foreground text-xs">
              3
            </Badge>
          </Button>

          {/* Emergency Button */}
          {showEmergencyButton && <EmergencyButton variant="compact" />}

          {/* Mobile Menu */}
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};