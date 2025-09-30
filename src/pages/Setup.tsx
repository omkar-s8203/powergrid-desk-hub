import { SignupForm } from '@/components/auth/SignupForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroPowergrid from '@/assets/hero-powergrid.jpg';
import powerGrideLogo from '@/assets/powerGrideLogo.png';

export default function Setup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background from Index.tsx */}
      <div className="absolute inset-0 z-0">
        <img src={heroPowergrid} alt="PowerGrid IT Infrastructure" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/80 via-black/50 to-green-600/80" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl text-white">
          <CardHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <img src={powerGrideLogo} alt="POWERGRID Logo" className="h-8 w-8" />
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold text-primary">POWERGRID</span>
                  <span className="text-xs text-muted-foreground -mt-1">IT Sahayata Desk</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold">Create Your Account</h1>
            </div>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}