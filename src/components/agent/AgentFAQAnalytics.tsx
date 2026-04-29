import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, MessageSquare, Star, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AgentFAQAnalytics() {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch FAQ analytics clusters
  const { data: clusters, isLoading, refetch } = useQuery({
    queryKey: ['faq-analytics'],
    queryFn: async () => {
      const { data } = await supabase
        .from('faq_analytics' as any)
        .select('*')
        .order('question_count', { ascending: false })
        .limit(50);
      return (data || []) as any[];
    },
  });

  // Fetch recent ratings summary
  const { data: ratingsSummary } = useQuery({
    queryKey: ['ratings-summary'],
    queryFn: async () => {
      const { data } = await supabase
        .from('conversation_ratings' as any)
        .select('rating, channel')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!data || data.length === 0) return { avg: 0, total: 0, byChannel: {} };
      const ratings = data as any[];
      const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
      const byChannel: Record<string, { count: number; avg: number }> = {};
      for (const r of ratings) {
        const ch = r.channel || 'web';
        if (!byChannel[ch]) byChannel[ch] = { count: 0, avg: 0 };
        byChannel[ch].count++;
        byChannel[ch].avg += r.rating;
      }
      for (const ch of Object.keys(byChannel)) {
        byChannel[ch].avg = byChannel[ch].avg / byChannel[ch].count;
      }
      return { avg: Math.round(avg * 10) / 10, total: ratings.length, byChannel };
    },
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { error } = await supabase.functions.invoke('analyze-faq-trends', {
        body: { daysBack: 30 },
      });
      if (error) throw error;
      toast({ title: 'Analysis complete', description: 'FAQ clusters have been updated' });
      refetch();
    } catch (err) {
      console.error('Analysis failed:', err);
      toast({ title: 'Analysis failed', description: 'Check edge function logs', variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateArticle = async (cluster: any) => {
    try {
      toast({ title: 'Generating AI answer...', description: 'Please wait while AI drafts a KB article' });
      
      const { data, error } = await supabase.functions.invoke('generate-kb-answer', {
        body: {
          user_question: cluster.question_cluster,
          language: 'en',
        },
      });

      if (error) throw error;

      await supabase.from('pending_kb_suggestions').insert({
        user_question: cluster.question_cluster,
        ai_suggested_answer: data?.answer || `Auto-suggested from FAQ analytics (${cluster.question_count} occurrences)`,
        ai_confidence: 0.8,
        language: 'en',
        status: 'pending',
      } as any);
      toast({ title: 'KB suggestion created', description: 'AI-generated answer ready for review in Pending Suggestions' });
    } catch (err) {
      console.error('Failed to create suggestion:', err);
      toast({ title: 'Error', description: 'Failed to generate KB suggestion', variant: 'destructive' });
    }
  };

  const getGapBadge = (cluster: any) => {
    const avg = cluster.avg_rating;
    if (!avg || avg < 2.5) return <Badge className="bg-red-100 text-red-700 text-[10px]">Knowledge Gap</Badge>;
    if (avg < 3.5) return <Badge className="bg-amber-100 text-amber-700 text-[10px]">Needs Improvement</Badge>;
    return <Badge className="bg-green-100 text-green-700 text-[10px]">Good</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-3 text-center">
            <Star className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold text-[#1A1A1A]">{ratingsSummary?.avg || '—'}</p>
            <p className="text-[10px] text-[#6B7280]">Avg Rating</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-3 text-center">
            <MessageSquare className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold text-[#1A1A1A]">{ratingsSummary?.total || 0}</p>
            <p className="text-[10px] text-[#6B7280]">Total Ratings</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold text-[#1A1A1A]">{clusters?.length || 0}</p>
            <p className="text-[10px] text-[#6B7280]">FAQ Clusters</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel breakdown */}
      {ratingsSummary?.byChannel && Object.keys(ratingsSummary.byChannel).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(ratingsSummary.byChannel).map(([ch, data]: [string, any]) => (
            <Badge key={ch} variant="outline" className="text-xs border-[#E5E7EB] text-[#374151]">
              {ch === 'web' ? '💬' : ch === 'voice' ? '🎤' : ch === 'line' ? '🟢' : ch === 'facebook' ? '📘' : '📱'} {ch}: {Math.round(data.avg * 10) / 10}⭐ ({data.count})
            </Badge>
          ))}
        </div>
      )}

      {/* Analyze button */}
      <Button
        onClick={handleAnalyze}
        disabled={analyzing}
        variant="outline"
        size="sm"
        className="w-full border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
      >
        {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
        {analyzing ? 'Analyzing conversations...' : 'Run FAQ Analysis'}
      </Button>

      {/* Clusters */}
      {isLoading ? (
        <div className="py-6 text-center text-[#6B7280]">Loading clusters...</div>
      ) : !clusters?.length ? (
        <div className="py-6 text-center text-[#6B7280]">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No FAQ clusters yet. Run analysis to generate insights.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clusters.map((cluster: any) => (
            <Card key={cluster.id} className="bg-white border-[#E5E7EB]">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm text-[#1A1A1A]">{cluster.question_cluster}</span>
                      {getGapBadge(cluster)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                      <span>📊 {cluster.question_count}x asked</span>
                      {cluster.avg_rating && <span>⭐ {Number(cluster.avg_rating).toFixed(1)}</span>}
                      {cluster.channels?.length > 0 && (
                        <span>{(cluster.channels as string[]).join(', ')}</span>
                      )}
                    </div>
                    {cluster.sample_questions?.length > 0 && (
                      <p className="text-xs text-[#9CA3AF] mt-1 truncate">
                        e.g. "{(cluster.sample_questions as string[])[0]}"
                      </p>
                    )}
                  </div>
                  {!cluster.auto_suggested && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateArticle(cluster)}
                      className="shrink-0 text-xs border-[#E5E7EB] text-[#374151]"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      KB
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
