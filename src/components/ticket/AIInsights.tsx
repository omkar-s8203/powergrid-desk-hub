import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Loader2, RefreshCw, Smile, Meh, Frown, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIInsightsProps {
  ticketId: string;
  aiSummary?: string | null;
  sentiment?: string | null;
  sentimentScore?: number | null;
  analyzedAt?: string | null;
  onAnalysisComplete?: () => void;
}

const sentimentConfig = {
  positive: { icon: Smile, label: 'Positive', className: 'bg-green-100 text-green-800 border-green-200' },
  neutral: { icon: Meh, label: 'Neutral', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  frustrated: { icon: Frown, label: 'Frustrated', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  urgent: { icon: AlertTriangle, label: 'Urgent', className: 'bg-red-100 text-red-800 border-red-200' },
};

export function AIInsights({ ticketId, aiSummary, sentiment, sentimentScore, analyzedAt, onAnalysisComplete }: AIInsightsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-ticket', {
        body: { ticketId }
      });

      if (error) throw error;

      toast({ title: 'Analysis Complete', description: 'AI insights have been generated.' });
      onAnalysisComplete?.();
    } catch (error) {
      console.error('Error analyzing ticket:', error);
      toast({ title: 'Error', description: 'Failed to analyze ticket.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const config = sentiment ? sentimentConfig[sentiment as keyof typeof sentimentConfig] : null;
  const SentimentIcon = config?.icon || Meh;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Brain className="h-4 w-4 text-primary" />
            AI Insights
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={runAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {aiSummary ? 'Re-analyze' : 'Analyze'}
          </Button>
        </div>

        {aiSummary ? (
          <>
            <div className="flex items-center gap-2">
              {config && (
                <Badge className={config.className}>
                  <SentimentIcon className="h-3 w-3 mr-1" />
                  {config.label}
                  {sentimentScore != null && (
                    <span className="ml-1 opacity-75">({sentimentScore.toFixed(2)})</span>
                  )}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
            {analyzedAt && (
              <p className="text-xs text-muted-foreground/60">
                Analyzed: {new Date(analyzedAt).toLocaleString()}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click "Analyze" to generate AI-powered summary and sentiment analysis.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
