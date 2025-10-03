import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThumbsUp, Video, Eye, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';

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

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    role: string;
  };
}

interface ArticleDetailModalProps {
  article: KnowledgeArticle | null;
  open: boolean;
  onClose: () => void;
  onLikeUpdate?: (articleId: string, newLikeCount: number) => void;
}

export const ArticleDetailModal = ({ article, open, onClose, onLikeUpdate }: ArticleDetailModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (article && open) {
      fetchComments();
      fetchLikeStatus();
      incrementViews();
    }
  }, [article, open]);

  const fetchComments = async () => {
    if (!article) return;

    try {
      const { data, error } = await supabase
        .from('kb_comments')
        .select(`
          id,
          comment,
          created_at,
          user_id,
          profiles:user_id (
            full_name,
            role
          )
        `)
        .eq('article_id', article.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data as any || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchLikeStatus = async () => {
    if (!article || !profile) return;

    try {
      // Check if user has liked
      const { data: likeData, error: likeError } = await supabase
        .from('kb_likes')
        .select('id')
        .eq('article_id', article.id)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (likeError) throw likeError;
      setIsLiked(!!likeData);

      // Get total like count
      const { count, error: countError } = await supabase
        .from('kb_likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id);

      if (countError) throw countError;
      setLikeCount(count || 0);
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  };

  const incrementViews = async () => {
    if (!article) return;

    try {
      await supabase
        .from('knowledge_base')
        .update({ views_count: article.views_count + 1 })
        .eq('id', article.id);
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const handleLike = async () => {
    if (!article || !profile) {
      toast({
        title: 'Error',
        description: 'You must be logged in to like articles',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('kb_likes')
          .delete()
          .eq('article_id', article.id)
          .eq('user_id', profile.id);

        if (error) throw error;
        
        setIsLiked(false);
        const newCount = likeCount - 1;
        setLikeCount(newCount);
        onLikeUpdate?.(article.id, newCount);
      } else {
        // Like
        const { error } = await supabase
          .from('kb_likes')
          .insert({
            article_id: article.id,
            user_id: profile.id,
          });

        if (error) throw error;
        
        setIsLiked(true);
        const newCount = likeCount + 1;
        setLikeCount(newCount);
        onLikeUpdate?.(article.id, newCount);

        toast({
          title: 'Thank you!',
          description: 'Your feedback helps us improve',
        });
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update like',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!article || !profile || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('kb_comments')
        .insert({
          article_id: article.id,
          user_id: profile.id,
          comment: newComment.trim(),
        })
        .select(`
          id,
          comment,
          created_at,
          user_id,
          profiles:user_id (
            full_name,
            role
          )
        `)
        .single();

      if (error) throw error;

      setComments([data as any, ...comments]);
      setNewComment('');
      
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      });
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('kb_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(comments.filter(c => c.id !== commentId));
      
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  if (!article) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{article.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {article.category}
                </Badge>
                {article.video_url && (
                  <Badge variant="secondary" className="gap-1">
                    <Video className="w-3 h-3" />
                    Video
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Article Content */}
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-foreground">
                {article.content}
              </div>
            </div>

            {/* Video */}
            {article.video_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={article.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Stats and Like Button */}
            <div className="flex items-center justify-between py-4 border-y">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {article.views_count} views
                </span>
                <span className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  {likeCount} likes
                </span>
              </div>
              <Button
                variant={isLiked ? "default" : "outline"}
                onClick={handleLike}
                disabled={loading}
                className="gap-2"
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>

              {/* Add Comment Form */}
              <form onSubmit={handleSubmitComment} className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  disabled={submittingComment}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </form>

              <Separator />

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="space-y-2 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{comment.profiles.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>
                        {profile?.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm">{comment.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
