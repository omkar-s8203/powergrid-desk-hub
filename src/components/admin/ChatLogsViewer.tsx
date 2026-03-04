import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, User, MessageCircle, Brain, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface ConversationSession {
  session_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  message_count: number;
  first_message: string;
  last_message: string;
  tone?: string;
  tone_score?: number;
  tone_summary?: string;
}

interface ChatMessage {
  id: string;
  role: string;
  message: string;
  created_at: string;
}

const toneColors: Record<string, string> = {
  polite: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  neutral: 'bg-muted text-muted-foreground',
  impatient: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  frustrated: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  rude: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  aggressive: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-100',
};

export function ChatLogsViewer() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchSessions();
  }, [filterUser]);

  const fetchSessions = async () => {
    setLoading(true);

    // Get all conversations grouped by session
    let query = supabase.from('chat_conversations')
      .select('session_id, user_id, role, message, created_at')
      .order('created_at', { ascending: true });

    if (filterUser !== 'all') {
      query = query.eq('user_id', filterUser);
    }

    const { data: convos } = await query;
    if (!convos?.length) {
      setSessions([]);
      setLoading(false);
      return;
    }

    // Get unique users
    const userIds = [...new Set(convos.map(c => c.user_id))];
    const { data: profiles } = await supabase.from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Set user list for filter
    const uniqueUsers = userIds.map(id => ({
      id,
      name: profileMap.get(id)?.full_name || 'Unknown'
    }));
    setUsers(uniqueUsers);

    // Group by session
    const sessionMap = new Map<string, typeof convos>();
    convos.forEach(c => {
      if (!sessionMap.has(c.session_id)) sessionMap.set(c.session_id, []);
      sessionMap.get(c.session_id)!.push(c);
    });

    // Get tone analyses
    const sessionIds = [...sessionMap.keys()];
    const { data: analyses } = await supabase.from('chat_session_analysis')
      .select('session_id, tone, tone_score, summary')
      .in('session_id', sessionIds);

    const analysisMap = new Map(analyses?.map(a => [a.session_id, a]) || []);

    const sessionList: ConversationSession[] = [];
    sessionMap.forEach((msgs, sessionId) => {
      const userId = msgs[0].user_id;
      const profile = profileMap.get(userId);
      const analysis = analysisMap.get(sessionId);
      const userMsgs = msgs.filter(m => m.role === 'user');

      sessionList.push({
        session_id: sessionId,
        user_id: userId,
        user_name: profile?.full_name || 'Unknown',
        user_email: profile?.email || '',
        message_count: userMsgs.length,
        first_message: msgs[0].created_at,
        last_message: msgs[msgs.length - 1].created_at,
        tone: analysis?.tone,
        tone_score: analysis?.tone_score,
        tone_summary: analysis?.summary,
      });
    });

    // Sort by most recent first
    sessionList.sort((a, b) => new Date(b.last_message).getTime() - new Date(a.last_message).getTime());
    setSessions(sessionList);
    setLoading(false);
  };

  const loadSessionMessages = async (sessionId: string) => {
    setSelectedSession(sessionId);
    const { data } = await supabase.from('chat_conversations')
      .select('id, role, message, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const analyzeSession = async (sessionId: string) => {
    setAnalyzing(true);
    try {
      // Get user messages for analysis
      const { data: msgs } = await supabase.from('chat_conversations')
        .select('role, message')
        .eq('session_id', sessionId)
        .eq('role', 'user');

      if (!msgs?.length) return;

      const session = sessions.find(s => s.session_id === sessionId);

      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          message: `Analyze the communication tone of this employee in their chatbot conversation. Here are the employee's messages:\n\n${msgs.map(m => m.message).join('\n---\n')}\n\nProvide a tone analysis.`,
          role: 'admin',
          userId: session?.user_id,
          sessionId: 'admin-analysis-' + Date.now(),
          conversationHistory: [],
        }
      });

      // Refresh sessions to get updated analysis
      await fetchSessions();
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading chat logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Chat Logs</h1>
          <p className="text-muted-foreground">View chatbot conversations and AI tone analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No chatbot conversations found yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">Sessions ({sessions.length})</h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 pr-4">
                {sessions.map(session => (
                  <Card
                    key={session.session_id}
                    className={cn(
                      "cursor-pointer transition-colors hover:border-primary",
                      selectedSession === session.session_id && "border-primary bg-primary/5"
                    )}
                    onClick={() => loadSessionMessages(session.session_id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-foreground">{session.user_name}</span>
                        {session.tone && (
                          <Badge className={cn("text-xs", toneColors[session.tone] || toneColors.neutral)}>
                            {session.tone}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{session.user_email}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{session.message_count} messages</span>
                        <span>{new Date(session.last_message).toLocaleDateString()}</span>
                      </div>
                      {session.tone_summary && (
                        <p className="text-xs text-muted-foreground mt-2 italic border-t border-border pt-2">
                          {session.tone_summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Conversation View */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <Card className="h-[650px] flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {sessions.find(s => s.session_id === selectedSession)?.user_name}'s Conversation
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analyzeSession(selectedSession)}
                      disabled={analyzing}
                    >
                      <Brain className="h-4 w-4 mr-1" />
                      {analyzing ? 'Analyzing...' : 'Analyze Tone'}
                    </Button>
                  </div>
                  {(() => {
                    const s = sessions.find(s => s.session_id === selectedSession);
                    return s?.tone ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={cn(toneColors[s.tone] || toneColors.neutral)}>{s.tone}</Badge>
                        {s.tone_score !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            Score: {(s.tone_score * 100).toFixed(0)}% positive
                          </span>
                        )}
                      </div>
                    ) : null;
                  })()}
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={cn("flex gap-2", msg.role === 'assistant' ? "justify-start" : "justify-end")}
                        >
                          {msg.role === 'assistant' && <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-1" />}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                              msg.role === 'assistant' ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                            )}
                          >
                            {msg.role === 'assistant' ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                                <ReactMarkdown>{msg.message}</ReactMarkdown>
                              </div>
                            ) : msg.message}
                            <div className="text-[10px] opacity-60 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                          {msg.role === 'user' && <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[650px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3" />
                  <p>Select a session to view the conversation</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
