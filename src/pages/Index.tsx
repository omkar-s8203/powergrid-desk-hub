import { useState } from 'react'; // 1. ADDED USESTATE
import { useNavigate } from 'react-router-dom';
import heroPowergrid from '@/assets/hero-powergrid.jpg';
import { Button } from "@/components/ui/button";
import powerGrideLogo from '@/assets/powerGrideLogo.png';
import modiImage from '@/assets/modi.png';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// 1. ADDED DROPDOWN & ICON IMPORTS
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    Zap, Shield, Users, Bot, Globe2, Heart, Brain,
    MessageSquare, BarChart3, Smartphone, ChevronDown, Menu, X, Building2
} from "lucide-react";

const Index = () => {
    const navigate = useNavigate();
    // 2. ADDED STATE FOR MOBILE MENU
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const features = [
      { icon: Brain, title: "AI-Powered Classification", description: "Intelligent ticket categorization and routing using advanced NLP algorithms designed for Indian IT environments.", badge: "Smart", color: "from-blue-500 to-purple-600" },
      { icon: MessageSquare, title: "Multilingual Chatbot", description: "24/7 AI assistant supporting Hindi, English, and regional languages for seamless employee interaction.", badge: "Bharatiya", color: "from-orange-500 to-yellow-500" },
      { icon: Users, title: "Multi-Role Dashboard", description: "Dedicated interfaces for employees, IT staff, and administrators with role-based access control.", badge: "Secure", color: "from-green-500 to-emerald-600" },
      { icon: BarChart3, title: "Analytics & Reports", description: "Comprehensive performance metrics, resolution tracking, and insights for continuous improvement.", badge: "Insights", color: "from-purple-500 to-pink-600" },
      { icon: Zap, title: "Instant Notifications", description: "Real-time SMS and email alerts for ticket updates, ensuring no communication gaps.", badge: "Fast", color: "from-yellow-500 to-red-500" },
      { icon: Smartphone, title: "Mobile Responsive", description: "Fully optimized mobile experience for on-the-go access across all devices and platforms.", badge: "Mobile", color: "from-teal-500 to-blue-600" },
      { icon: Shield, title: "Enterprise Security", description: "Bank-grade security with encryption, audit trails, and compliance with Indian data protection laws.", badge: "Protected", color: "from-red-500 to-pink-600" },
      { icon: Globe2, title: "Knowledge Base", description: "Searchable repository of solutions, FAQs, and best practices for self-service resolution.", badge: "Smart", color: "from-indigo-500 to-blue-600" },
      { icon: Heart, title: "Swadeshi Solution", description: "Proudly built in India with local support, ensuring data sovereignty and cultural understanding.", badge: "🇮🇳 Desi", color: "from-orange-500 via-white to-green-600" }
    ];

    const stats = [
      { number: "99.9%", label: "System Uptime", description: "Reliable 24/7 operations" },
      { number: "< 2min", label: "Response Time", description: "AI-powered quick resolution" },
      { number: "500K+", label: "Employees Served", description: "Across POWERGRID network" },
      { number: "15+", label: "Languages", description: "Supporting diverse workforce" },
      { number: "100%", label: "Made in India", description: "Supporting Atmanirbhar vision" },
      { number: "24/7", label: "AI Support", description: "Round-the-clock assistance" }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header Section with Mobile Menu */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
                <div className="container flex h-16 items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <img src={powerGrideLogo} alt="POWERGRID Logo" className="h-8 w-8" />
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-primary">POWERGRID</span>
                                <span className="text-xs text-muted-foreground -mt-1">IT Sahayata Desk</span>
                            </div>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
                        <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</a>
                        <a href="#support" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Support</a>
                    </nav>
                    <div className="hidden md:flex items-center gap-2">
                        {/* 2. REPLACED SIGN IN BUTTON WITH DROPDOWN */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    Sign In
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate('/login/admin')}>
                                    Admin Login
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/login/employee')}>
                                    Employee Login
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/login/it_helpdesk')}>
                                    IT Helpdesk Login
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90" size="sm" onClick={() => navigate('/setup')}>Get Started</Button>
                    </div>
                    {/* 3. ADDED HAMBURGER MENU BUTTON */}
                    <div className="md:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
                {/* 4. ADDED MOBILE MENU CONTENT */}
                {isMenuOpen && (
                    <div className="md:hidden bg-background border-t">
                        <nav className="flex flex-col items-center gap-4 py-4">
                            <a href="#features" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>Features</a>
                            <a href="#about" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>About</a>
                            <a href="#support" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>Support</a>
                            <Separator className="w-3/4" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost">Sign In <ChevronDown className="h-4 w-4 ml-1" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center">
                                    <DropdownMenuItem onClick={() => { navigate('/login/admin'); setIsMenuOpen(false); }}>Admin Login</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { navigate('/login/employee'); setIsMenuOpen(false); }}>Employee Login</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { navigate('/login/it_helpdesk'); setIsMenuOpen(false); }}>IT Helpdesk Login</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button className="w-3/4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90" onClick={() => { navigate('/setup'); setIsMenuOpen(false); }}>Get Started</Button>
                        </nav>
                    </div>
                )}
            </header>

            <main>
                 {/* Hero Section */}
                <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                     {/* Background with overlay */}
                     <div className="absolute inset-0 z-0" id="particles-container">
                         <img 
                           src={heroPowergrid} 
                           alt="PowerGrid IT Infrastructure" 
                           className="w-full h-full object-cover"
                         />
                         <div className="absolute inset-0 bg-gradient-to-br from-orange-500/80 via-black/50 to-green-600/80" />
                     </div>
                     
                     {/* Particle Animation */}
                     <div className="absolute inset-0 z-0 overflow-hidden">
                         {Array.from({ length: 100 }).map((_, i) => (
                             <div
                                 key={i}
                                 className="absolute bg-white/10 rounded-full"
                                 style={{
                                     width: `${Math.random() * 3 + 1}px`,
                                     height: `${Math.random() * 3 + 1}px`,
                                     left: `${Math.random() * 100}%`,
                                     bottom: '-5%',
                                     animation: `float-up ${5 + Math.random() * 15}s linear ${Math.random() * 10}s infinite`,
                                 }}
                             />
                         ))}
                     </div>
                     
                     {/* Animated background elements */}
                     <div className="absolute inset-0 z-10">
                         <div className="absolute top-20 left-20 w-32 h-32 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
                         <div className="absolute bottom-32 right-32 w-24 h-24 bg-green-500/20 rounded-full blur-xl animate-pulse delay-1000" />
                         <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg animate-bounce delay-500" />
                     </div>
 
                     <div className="relative z-20 container mx-auto px-4 lg:px-8 text-center">
                         <div className="max-w-4xl mx-auto">
                             {/* Badges */}
                             <div className="flex flex-wrap justify-center gap-2 mb-6">
                                 <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                     🇮🇳 Atmanirbhar Bharat
                                 </Badge>
                                 <Badge className="bg-white/20 text-white border-white/30">
                                     AI-Powered
                                 </Badge>
                                 <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                     Made in India
                                 </Badge>
                             </div>
 
                             {/* Main heading */}
                             <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                                 <span className="block">Intelligent IT</span>
                                 <span className="block bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent">
                                     Sahayata Desk
                                 </span>
                             </h1>
 
                             {/* Subtitle */}
                             <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                                 Revolutionary AI-powered IT helpdesk prototype for POWERGRID - India's largest transmission utility. 
                                 <span className="font-semibold"> Atmanirbhar</span> digital solution supporting 
                                 <span className="font-semibold"> Make in India</span> mission with cutting-edge indigenous technology.
                             </p>
 
                             {/* Features grid */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-3xl mx-auto">
                                 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                     <Bot className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                                     <span className="text-white text-sm font-medium">AI Classification</span>
                                 </div>
                                 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                     <Zap className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
                                     <span className="text-white text-sm font-medium">Instant Response</span>
                                 </div>
                                 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                     <Users className="h-8 w-8 text-green-300 mx-auto mb-2" />
                                     <span className="text-white text-sm font-medium">Multi-Role Access</span>
                                 </div>
                                 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                     <Shield className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                                     <span className="text-white text-sm font-medium">Secure & Reliable</span>
                                 </div>
                             </div>
 
                             {/* CTA Buttons */}
                             <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                                  <Button className="text-lg px-8 bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90" size="lg" onClick={() => navigate('/setup')}>
                                      Start Your Journey
                                  </Button>
                                 <Button variant="outline" size="lg" className="text-lg px-8 border-white text-white hover:bg-white hover:text-primary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                                     Learn More
                                 </Button>
                             </div>
 
                             {/* Stats */}
                             <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
                                 <div>
                                     <div className="text-2xl font-bold text-orange-400">100%</div>
                                     <div className="text-white/80 text-sm">Made in India</div>
                                 </div>
                                 <div>
                                     <div className="text-2xl font-bold text-yellow-300">AI-Powered</div>
                                     <div className="text-white/80 text-sm">Smart Routing</div>
                                 </div>
                                 <div>
                                     <div className="text-2xl font-bold text-green-300">24/7</div>
                                     <div className="text-white/80 text-sm">Support Ready</div>
                                 </div>
                             </div>
                         </div>
                     </div>
 
                     {/* Bottom gradient fade */}
                     <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
                 </section>

                 {/* Keyframes for particle animation */}
                 <style>{`
                     @keyframes float-up {
                         0% {
                             transform: translateY(0);
                             opacity: 0;
                         }
                         50% { opacity: 1; }
                         100% {
                             transform: translateY(-105vh);
                             opacity: 0;
                         }
                     }
                 `}</style>

                {/* About Section */}
                <section id="about" className="py-20 bg-background">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="text-center mb-16">
                            <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-green-600 text-white border-0">🇮🇳 Power Grid Corporation of India</Badge>
                            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">About <span className="text-primary">POWERGRID</span></h2>
                            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">A 'Maharatna' Company under Ministry of Power, POWERGRID is the largest transmission utility in India and a leading power Grid Company in the world.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 text-foreground">
                            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"><div className="text-3xl font-bold text-primary mb-2">1,72,000+</div><div className="text-sm text-muted-foreground">Circuit Kilometers</div></div>
                            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"><div className="text-3xl font-bold text-orange-500 mb-2">280+</div><div className="text-sm text-muted-foreground">Sub-stations</div></div>
                            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"><div className="text-3xl font-bold text-green-600 mb-2">15,000+</div><div className="text-sm text-muted-foreground">Employees</div></div>
                            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"><div className="text-3xl font-bold text-primary mb-2">50%</div><div className="text-sm text-muted-foreground">India's Power Transmission</div></div>
                        </div>
                    </div>
                </section>

                {/* Atmanirbhar Vision Section */}
                <section id="vision" className="py-20 bg-gradient-to-br from-orange-500/10 via-background to-green-600/10">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="text-center lg:text-left">
                                <Badge className="mb-4 bg-gradient-to-r from-orange-500 via-white to-green-600 text-transparent bg-clip-text border-0 font-bold text-lg">The Vision</Badge>
                                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Driving an <span className="text-primary">Atmanirbhar Bharat</span></h2>
                                <p className="text-lg text-foreground/80 mb-4 leading-relaxed">
                                    Our IT Sahayata Desk is a testament to India's technological prowess, born from the vision of 'Make in India' and 'Digital India'. By developing this critical infrastructure in-house, we are not just solving problems—we are building a self-reliant, digitally empowered nation.
                                </p>
                                <p className="text-lg text-foreground/80 leading-relaxed">
                                    This platform embodies the Swadeshi spirit, encouraging the use of Indian products and ensuring our data remains sovereign. It is a proud step towards making POWERGRID, and India, a global leader in technology and innovation.
                                </p>
                            </div>
                            <div 
                                className="group relative max-w-md mx-auto"
                            >
                                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden p-1 shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
                                    <img 
                                        src={modiImage} 
                                        alt="Vision of Make in India - Narendra Modi" 
                                        className="rounded-md w-full h-auto object-cover" 
                                    />
                                </Card>
                                <blockquote className="mt-6 border-l-4 border-orange-400 pl-4 italic text-foreground/80">
                                    "The more we make in India, the more we will create jobs and the more our purchasing power will increase."
                                    <cite className="block not-italic font-semibold text-foreground mt-2">- Narendra Modi</cite>
                                </blockquote>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-gradient-to-b from-background to-black/20">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="text-center mb-16">
                            <Badge className="mb-4 bg-orange-500/10 text-orange-500 border-orange-500/20">Atmanirbhar Features</Badge>
                            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Built for <span className="text-primary">Modern India</span></h2>
                            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Experience indigenous technology designed for Indian organizations, combining global standards with local requirements.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <Card key={index} className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/30 hover:-translate-y-2 transition-all duration-300">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white group-hover:scale-110 transition-transform duration-300`}><feature.icon className="h-6 w-6" /></div>
                                            <Badge variant="outline" className="border-primary/20 text-primary group-hover:border-primary transition-colors">{feature.badge}</Badge>
                                        </div>
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent><CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription></CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* Stats Section */}
                <section className="py-20 bg-gradient-to-br from-orange-500/80 via-black/70 to-green-600/80 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                    <div className="container mx-auto px-4 lg:px-8 relative z-10">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4">Powering India's <span className="text-orange-400">Digital Future</span></h2>
                            <p className="text-xl text-white/90 max-w-3xl mx-auto">Our indigenous IT helpdesk solution is making a real impact across POWERGRID's operations, demonstrating the power of Atmanirbhar technology.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stats.map((stat, index) => (
                                <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 group">
                                    <CardContent className="p-6 text-center">
                                        <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2 group-hover:scale-110 transition-transform duration-300">{stat.number}</div>
                                        <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
                                        <div className="text-white/80 text-sm">{stat.description}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer Section */}
            <footer id="support" className="bg-background border-t border-white/10">
                <div className="container mx-auto px-4 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <img src={powerGrideLogo} alt="POWERGRID Logo" className="h-8 w-8" />
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold text-primary">POWERGRID</span><span className="text-xs text-muted-foreground -mt-1">IT Sahayata Desk</span>
                                </div>
                            </div>
                            <p className="text-muted-foreground text-sm">Empowering India's digital transformation with indigenous IT solutions. Supporting Atmanirbhar Bharat through innovative technology.</p>
                            <div className="flex gap-2"><Badge variant="outline" className="border-orange-500 text-orange-500">🇮🇳 Made in India</Badge><Badge variant="outline" className="border-green-600 text-green-600">Swadeshi</Badge></div>
                        </div>
                        <div className="space-y-4"><h3 className="font-semibold text-foreground">Quick Links</h3><ul className="space-y-2 text-sm"><li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li><li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About Us</a></li><li><a href="#support" className="text-muted-foreground hover:text-primary transition-colors">Support</a></li></ul></div>
                        <div className="space-y-4"><h3 className="font-semibold text-foreground">Resources</h3><ul className="space-y-2 text-sm"><li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Documentation</a></li><li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Knowledge Base</a></li></ul></div>
                        <div className="space-y-4"><h3 className="font-semibold text-foreground">Support</h3><ul className="space-y-2 text-sm"><li className="text-muted-foreground">📧 support@powergrid.in</li><li className="text-muted-foreground">📞 1800-XXX-XXXX</li><li className="text-muted-foreground">🕒 24/7 AI Support</li></ul></div>
                    </div>
                    <Separator className="my-8" />
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} POWERGRID Corporation of India. All rights reserved.</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground"><span>🇮🇳 Proudly Indian</span><span>•</span><span>Atmanirbhar Technology</span><span>•</span><span>Digital India</span></div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Index;