import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import heroPowergrid from '@/assets/hero-powergrid.jpg';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-white">
      {/* Background from Index.tsx */}
      <div className="absolute inset-0 z-0">
        <img src={heroPowergrid} alt="PowerGrid IT Infrastructure" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/80 to-green-800/90" />
      </div>

      <div className="relative z-10 text-center space-y-6">
        <h1 className="text-8xl font-bold bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent">404</h1>
        <p className="text-2xl text-white/90">Oops! The page you're looking for doesn't exist.</p>
        <Button variant="outline" onClick={() => navigate('/')} className="text-lg px-8 border-white text-white hover:bg-white hover:text-primary"> <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home </Button>
      </div>
    </div>
  );
};

export default NotFound;
