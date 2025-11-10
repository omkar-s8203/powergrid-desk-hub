import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, CheckCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';

export default function SeedKnowledge() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number; total: number } | null>(null);
  const { toast } = useToast();
  const { profile, loading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-knowledge-base');

      if (error) throw error;

      setResult(data);
      toast({
        title: 'Success',
        description: `Added ${data.inserted} new articles, skipped ${data.skipped} existing articles`,
      });
    } catch (error) {
      console.error('Error seeding knowledge base:', error);
      toast({
        title: 'Error',
        description: 'Failed to seed knowledge base',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Seed Knowledge Base
          </CardTitle>
          <CardDescription>
            Add comprehensive IT support articles to your knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Articles to be added:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Printer Not Responding or Offline
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Email Not Syncing on Mobile Device
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Computer Running Slow - Performance Optimization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Forgot Password - Account Recovery
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Laptop Won't Turn On or Charge
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Software Installation Requests
              </li>
            </ul>
          </div>

          {result && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Result:</h4>
              <div className="space-y-1 text-sm">
                <p>✅ Inserted: {result.inserted} articles</p>
                <p>⏭️ Skipped: {result.skipped} existing articles</p>
                <p>📚 Total: {result.total} articles processed</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleSeed}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Knowledge Base...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Seed Knowledge Base
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This will add comprehensive IT support articles with detailed step-by-step solutions.
            Existing articles will be skipped automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
