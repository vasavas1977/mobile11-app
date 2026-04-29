import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Target,
  Eye,
  Heart,
  Shield,
  Gauge,
  Smile,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AIScoreCardProps {
  conversationId: string;
  compact?: boolean;
}

interface ScoreData {
  id: string;
  conversation_id: string;
  ai_accuracy_score: number | null;
  ai_resolution_score: number | null;
  ai_clarity_score: number | null;
  ai_empathy_score: number | null;
  ai_policy_compliance_score: number | null;
  ai_confidence_score: number | null;
  predicted_customer_satisfaction_score: number | null;
  business_outcome_score: number | null;
  composite_score: number | null;
  scoring_model_version: string | null;
  score_reasoning_summary: string | null;
  created_at: string;
  language: string | null;
  channel: string | null;
}

interface FailureEvent {
  id: string;
  failure_type: string;
  severity: string;
  failure_subtype: string | null;
  bot_response_excerpt: string | null;
  customer_last_message: string | null;
  root_cause_guess: string | null;
  suggested_fix_type: string | null;
  detected_by: string;
  created_at: string;
}

const SCORE_DIMENSIONS = [
  { key: 'ai_accuracy_score', label: 'Accuracy', icon: Target, description: 'Factual correctness of bot responses' },
  { key: 'ai_resolution_score', label: 'Resolution', icon: CheckCircle2, description: 'Whether the customer issue was resolved' },
  { key: 'ai_clarity_score', label: 'Clarity', icon: Eye, description: 'Clarity and structure of bot responses' },
  { key: 'ai_empathy_score', label: 'Empathy', icon: Heart, description: 'Emotional intelligence and tone appropriateness' },
  { key: 'ai_policy_compliance_score', label: 'Policy', icon: Shield, description: 'Adherence to company policies' },
  { key: 'ai_confidence_score', label: 'Confidence', icon: Gauge, description: 'Bot confidence and authority level' },
  { key: 'predicted_customer_satisfaction_score', label: 'Pred. CSAT', icon: Smile, description: 'Predicted customer satisfaction' },
  { key: 'business_outcome_score', label: 'Business', icon: TrendingUp, description: 'Business outcome quality' },
] as const;

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreProgressColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  return 'destructive';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function AIScoreCard({ conversationId, compact = false }: AIScoreCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scores, isLoading: scoresLoading } = useQuery({
    queryKey: ['ai-scores', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversation_scores')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data as unknown as ScoreData[]) || [];
    },
    enabled: !!conversationId,
  });

  const { data: failures } = useQuery({
    queryKey: ['ai-failures', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_failure_events')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as FailureEvent[]) || [];
    },
    enabled: !!conversationId,
  });

  const rescoreMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-score-conversations', {
        body: { conversation_id: conversationId, force_rescore: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-scores', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['ai-failures', conversationId] });
      toast({ title: 'Re-scoring complete', description: 'AI scores have been recalculated.' });
    },
    onError: (err: any) => {
      toast({ title: 'Re-scoring failed', description: err.message, variant: 'destructive' });
    },
  });

  const score = scores?.[0];

  if (scoresLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading AI scores...</span>
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            AI Quality Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Not yet scored by AI</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => rescoreMutation.mutate()}
            disabled={rescoreMutation.isPending}
            className="w-full"
          >
            {rescoreMutation.isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Brain className="h-3 w-3 mr-1" />
            )}
            Score Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const compositeScore = score.composite_score ?? 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Brain className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={cn('text-sm font-semibold', getScoreColor(compositeScore))}>
          {compositeScore}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    );
  }

  // Parse reasoning notes
  const reasoningParts = score.score_reasoning_summary?.split(' | ') || [];
  const summaryText = reasoningParts[0] || 'No summary available';

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              AI Quality Score
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {score.scoring_model_version}
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => rescoreMutation.mutate()}
                    disabled={rescoreMutation.isPending}
                  >
                    <RefreshCw className={cn('h-3 w-3', rescoreMutation.isPending && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Re-score with latest model</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Composite Score Hero */}
          <div className="text-center py-2">
            <div className={cn('text-4xl font-bold', getScoreColor(compositeScore))}>
              {compositeScore}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Composite Score</p>
            <div className="mt-2 mx-auto max-w-[200px]">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', getScoreProgressColor(compositeScore))}
                  style={{ width: `${compositeScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Score Breakdown Grid */}
          <div className="grid grid-cols-2 gap-2">
            {SCORE_DIMENSIONS.map((dim) => {
              const val = score[dim.key as keyof ScoreData] as number | null;
              const numVal = val ?? 0;
              return (
                <Tooltip key={dim.key}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-default">
                      <dim.icon className={cn('h-3.5 w-3.5 shrink-0', getScoreColor(numVal))} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted-foreground truncate">{dim.label}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-sm font-semibold', getScoreColor(numVal))}>
                            {numVal}
                          </span>
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', getScoreProgressColor(numVal))}
                              style={{ width: `${numVal}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">{dim.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {summaryText}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {score.language && (
                <Badge variant="outline" className="text-[10px]">
                  {score.language === 'th' ? '🇹🇭 Thai' : '🇺🇸 English'}
                </Badge>
              )}
              {score.channel && (
                <Badge variant="outline" className="text-[10px]">
                  {score.channel}
                </Badge>
              )}
            </div>
          </div>

          {/* Failures Section */}
          {failures && failures.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Detected Issues ({failures.length})
              </p>
              <div className="space-y-1.5">
                {failures.slice(0, 3).map((f) => (
                  <div
                    key={f.id}
                    className={cn(
                      'rounded-lg border p-2 text-[11px]',
                      getSeverityColor(f.severity)
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium capitalize">
                        {f.failure_type.replace(/_/g, ' ')}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-[9px] px-1 py-0', getSeverityColor(f.severity))}
                      >
                        {f.severity}
                      </Badge>
                    </div>
                    {f.root_cause_guess && (
                      <p className="mt-1 opacity-80">Root cause: {f.root_cause_guess}</p>
                    )}
                    {f.suggested_fix_type && (
                      <p className="mt-0.5 opacity-80">
                        Fix: <span className="font-medium">{f.suggested_fix_type.replace(/_/g, ' ')}</span>
                      </p>
                    )}
                  </div>
                ))}
                {failures.length > 3 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    +{failures.length - 3} more issues
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            Scored {new Date(score.created_at).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
