import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Check, X, Edit, Trash2, Video, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';
import { ArticleDetailModal } from './ArticleDetailModal';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  video_url: string | null;
  status: string;
  created_by: string;
  created_at: string;
  views_count: number;
  helpful_count: number;
}

export const AdminKnowledgeBase = () => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [pendingArticles, setPendingArticles] = useState<KnowledgeArticle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'hardware',
    video_url: '',
  });

  useEffect(() => {
    fetchArticles();
    fetchPendingArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const fetchPendingArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingArticles(data || []);
    } catch (error) {
      console.error('Error fetching pending articles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      if (editingArticle) {
        const { error } = await supabase
          .from('knowledge_base')
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category as any,
            video_url: formData.video_url || null,
          })
          .eq('id', editingArticle.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Article updated successfully' });
      } else {
        const { error } = await supabase
          .from('knowledge_base')
          .insert({
            title: formData.title,
            content: formData.content,
            category: formData.category as any,
            video_url: formData.video_url || null,
            created_by: profile.id,
            status: 'published',
          } as any);

        if (error) throw error;
        toast({ title: 'Success', description: 'Article created successfully' });
      }

      setIsDialogOpen(false);
      setEditingArticle(null);
      setFormData({ title: '', content: '', category: 'hardware', video_url: '' });
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: 'Error',
        description: 'Failed to save article',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ status: 'published' })
        .eq('id', articleId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Article approved and published' });
      fetchPendingArticles();
      fetchArticles();
    } catch (error) {
      console.error('Error approving article:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve article',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Article rejected' });
      fetchPendingArticles();
    } catch (error) {
      console.error('Error rejecting article:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject article',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Article deleted' });
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete article',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (article: KnowledgeArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      video_url: article.video_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleArticleClick = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setDetailModalOpen(true);
  };

  const handleLikeUpdate = (articleId: string, newLikeCount: number) => {
    setArticles(articles.map(a =>
      a.id === articleId ? { ...a, helpful_count: newLikeCount } : a
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Knowledge Base Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingArticle(null); setFormData({ title: '', content: '', category: 'hardware', video_url: '' }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</DialogTitle>
              <DialogDescription>
                {editingArticle ? 'Update the article details' : 'Add a new article to the knowledge base'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video_url">Video URL (optional)</Label>
                <Input
                  id="video_url"
                  type="url"
                  placeholder="https://youtube.com/embed/..."
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">Use YouTube embed URL format</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingArticle ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pendingArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval ({pendingArticles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleArticleClick(article)}
                          className="text-primary hover:underline font-medium flex items-center gap-2"
                        >
                          {article.title}
                          <Eye className="w-4 h-4" />
                        </button>
                        {article.video_url && <Video className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{article.category}</Badge>
                    </TableCell>
                    <TableCell>{new Date(article.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleApprove(article.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(article.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Published Articles ({articles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleArticleClick(article)}
                          className="text-primary hover:underline font-medium flex items-center gap-2"
                        >
                          {article.title}
                          <Eye className="w-4 h-4" />
                        </button>
                        {article.video_url && <Video className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{article.category}</Badge>
                  </TableCell>
                  <TableCell>{new Date(article.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(article)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(article.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ArticleDetailModal
        article={selectedArticle}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedArticle(null);
        }}
        onLikeUpdate={handleLikeUpdate}
      />
    </div>
  );
};
