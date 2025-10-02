import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Video, ThumbsUp, Eye, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  video_url: string | null;
  views_count: number;
  helpful_count: number;
  created_at: string;
}

export const KnowledgeBaseList = () => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedCategory, articles]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('status', 'published')
        .order('helpful_count', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load knowledge base articles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  };

  const markAsHelpful = async (articleId: string) => {
    try {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      const { error } = await supabase
        .from('knowledge_base')
        .update({ helpful_count: article.helpful_count + 1 })
        .eq('id', articleId);

      if (error) throw error;

      setArticles(articles.map(a =>
        a.id === articleId ? { ...a, helpful_count: a.helpful_count + 1 } : a
      ));

      toast({
        title: 'Thank you!',
        description: 'Your feedback helps us improve our knowledge base',
      });
    } catch (error) {
      console.error('Error marking as helpful:', error);
    }
  };

  const incrementViews = async (articleId: string) => {
    try {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      await supabase
        .from('knowledge_base')
        .update({ views_count: article.views_count + 1 })
        .eq('id', articleId);
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const categories = ['all', 'hardware', 'software', 'network', 'access', 'other'];

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {article.category}
                    </Badge>
                    {article.video_url && (
                      <Badge variant="secondary" className="gap-1">
                        <Video className="w-3 h-3" />
                        Video
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {article.content}
              </p>

              {article.video_url && (
                <div className="aspect-video rounded-md overflow-hidden bg-muted">
                  <iframe
                    src={article.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => incrementViews(article.id)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {article.views_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    {article.helpful_count}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsHelpful(article.id)}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Helpful
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No articles found</p>
        </div>
      )}
    </div>
  );
};
