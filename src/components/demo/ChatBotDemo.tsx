import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Bot, User, ArrowRight } from 'lucide-react';

export function ChatBotDemo() {
  const demoScenarios = [
    {
      userMessage: "My computer won't start up, it just shows a black screen",
      validation: "Valid IT Issue",
      category: "hardware",
      specialist: "Mike Hardware",
      outcome: "Auto-assigned to Hardware Specialist"
    },
    {
      userMessage: "Excel keeps crashing when I open large files",
      validation: "Valid IT Issue", 
      category: "software",
      specialist: "Sarah Software",
      outcome: "Auto-assigned to Software Specialist"
    },
    {
      userMessage: "I can't connect to the shared drive from home",
      validation: "Valid IT Issue",
      category: "network", 
      specialist: "Alex Network",
      outcome: "Auto-assigned to Network Specialist"
    },
    {
      userMessage: "I forgot my password and need access to the system",
      validation: "Valid IT Issue",
      category: "access",
      specialist: "Emma Access", 
      outcome: "Auto-assigned to Access Specialist"
    },
    {
      userMessage: "What time does the cafeteria close?",
      validation: "Not IT Related",
      category: null,
      specialist: null,
      outcome: "Helpful response, no ticket created"
    }
  ];

  const getValidationColor = (validation: string) => {
    if (validation === "Valid IT Issue") return "bg-green-100 text-green-800 border-green-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      hardware: "bg-blue-100 text-blue-800 border-blue-200",
      software: "bg-purple-100 text-purple-800 border-purple-200", 
      network: "bg-orange-100 text-orange-800 border-orange-200",
      access: "bg-teal-100 text-teal-800 border-teal-200"
    };
    return category ? colors[category] : "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Intelligent Ticket Routing Demo
        </CardTitle>
        <p className="text-muted-foreground">
          See how the chatbot validates issues and automatically routes them to the right specialist
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {demoScenarios.map((scenario, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              {/* User Message */}
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Employee:</p>
                  <p className="text-sm text-muted-foreground italic">"{scenario.userMessage}"</p>
                </div>
              </div>
              
              <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
              
              {/* AI Analysis */}
              <div className="flex items-start gap-2">
                <Bot className="h-4 w-4 mt-1 text-primary" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">AI Analysis:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getValidationColor(scenario.validation)}>
                      {scenario.validation === "Valid IT Issue" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {scenario.validation}
                    </Badge>
                    
                    {scenario.category && (
                      <Badge variant="outline" className={getCategoryColor(scenario.category)}>
                        {scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Outcome: </span>
                    <span className="text-muted-foreground">{scenario.outcome}</span>
                    {scenario.specialist && (
                      <span className="ml-2 text-primary font-medium">({scenario.specialist})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">How It Works:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Employee describes their issue in the chatbot</li>
            <li>2. AI validates if it's a legitimate IT issue</li>
            <li>3. If valid, AI categorizes it (hardware, software, network, access)</li>
            <li>4. System automatically creates ticket and assigns to specialist</li>
            <li>5. Employee gets immediate confirmation with ticket ID</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}