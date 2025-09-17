import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { UserTypeSelector } from "@/components/UserTypeSelector";
import { DashboardStats } from "@/components/DashboardStats";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import heroImage from "@/assets/hero-safesafar.jpg";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // If user is authenticated, redirect to tourist dashboard by default
    if (user) {
      navigate("/tourist");
    }
  }, [user, navigate]);

  const handleUserTypeSelection = (type: "tourist" | "authority" | "police") => {
    if (user) {
      // If authenticated, go directly to dashboard
      navigate(`/${type}`);
    } else {
      // If not authenticated, go to auth page with redirect info
      navigate("/auth", { state: { redirectTo: `/${type}` } });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showEmergencyButton={false} />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        
        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Safe Tourism,
              <br />
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Smart Response
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Real-time safety monitoring and emergency response system for tourists and authorities in India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm text-lg px-8 py-4"
                onClick={() => navigate("/auth")}
              >
                <Shield className="w-5 h-5 mr-2" />
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-transparent hover:bg-white/10 text-white border-white/50 text-lg px-8 py-4"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Access Type</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              SafeSafar provides tailored interfaces for both tourists seeking safety assistance and authorities managing emergency responses.
            </p>
          </div>
          
          <UserTypeSelector onSelect={handleUserTypeSelection} />
          
          {/* Auth Link */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground text-sm mb-4">
              Already have an account?
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="border-primary/20 hover:bg-primary/5"
            >
              Sign In / Sign Up
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">Real-time Safety Overview</h3>
          <DashboardStats />
        </div>
      </section>
    </div>
  );
};

export default Index;
