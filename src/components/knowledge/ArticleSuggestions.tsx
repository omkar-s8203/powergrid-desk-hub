import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, ExternalLink, Video } from 'lucide-react';

interface ArticleSuggestion {
  id: string;
  title: string;
  content: string;
  video_url: string | null;
  relevanceScore: number;
}

interface ArticleSuggestionsProps {
  ticketDescription: string;
  category: string;
}

export const ArticleSuggestions = ({ ticketDescription, category }: ArticleSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<ArticleSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketDescription && category) {
      fetchSuggestions();
    }
  }, [ticketDescription, category]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('suggest-kb-articles', {
        body: { ticketDescription, category }
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching article suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Suggested Solutions</CardTitle>
        </div>
        <CardDescription>
          These articles might help resolve your issue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((article) => (
          <div
            key={article.id}
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{article.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {article.content}
                </p>
              </div>
              {article.video_url && (
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Video className="w-3 h-3" />
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
