import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSpamRules, SpamLogEntry } from '@/hooks/useSpamRules';
import { useEmailWhitelist } from '@/hooks/useEmailWhitelist';
import { Loader2, Trash2, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function SpamInbox() {
  const { spamLog, loading, saving, refetchSpamLog } = useSpamRules();
  const { addToWhitelist, saving: whitelistSaving } = useEmailWhitelist();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Extract email address from format like "Name <email@domain.com>"
  const extractEmail = (fromField: string): string => {
    const match = fromField.match(/<([^>]+)>/);
    return (match ? match[1] : fromField).toLowerCase().trim();
  };

  // Extract display name from format like "Name <email@domain.com>"
  const extractName = (fromField: string): string | null => {
    const match = fromField.match(/^([^<]+)\s*</);
    return match ? match[1].trim().replace(/"/g, '') : null;
  };

  // Normalize subject for matching (remove Re:, Fwd:, etc.)
  const normalizeSubject = (subject: string): string => {
    return subject
      .replace(/^(Re|RE|Fwd|FWD|Fw|FW):\s*/gi, '')
      .replace(/^(Re|RE|Fwd|FWD|Fw|FW)\[\d+\]:\s*/gi, '')
      .trim()
      .toLowerCase();
  };

  const handleMarkAsNotSpam = async (entry: SpamLogEntry) => {
    setProcessingId(entry.id);
    try {
      const senderEmail = extractEmail(entry.from_email);
      const senderName = extractName(entry.from_email);

      // 1. Add to whitelist
      await addToWhitelist(senderEmail, `Marked as not spam from spam log`);

      // 2. Get or create contact
      let contactId: string | null = null;
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .ilike('email', senderEmail)
        .maybeSingle();

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            email: senderEmail,
            name: senderName,
          })
          .select('id')
          .single();

        if (contactError) throw contactError;
        contactId = newContact.id;
      }

      // 3. Check for existing conversation with same subject from this contact
      let conversationId: string | null = null;
      const normalizedSubject = normalizeSubject(entry.subject || '');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id, subject, status')
        .eq('channel', 'email')
        .eq('contact_id', contactId)
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (existingConversations) {
        for (const conv of existingConversations) {
          if (normalizeSubject(conv.subject || '') === normalizedSubject) {
            conversationId = conv.id;
            
            // Reopen if closed/resolved
            if (conv.status === 'resolved' || conv.status === 'closed') {
              await supabase
                .from('conversations')
                .update({ status: 'open', updated_at: new Date().toISOString() })
                .eq('id', conversationId);
            } else {
              // Just update the timestamp
              await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversationId);
            }
            break;
          }
        }
      }

      // 4. If no existing conversation found, create new one
      if (!conversationId) {
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            contact_id: contactId,
            channel: 'email',
            subject: entry.subject || '(No Subject)',
            status: 'open',
            priority: 'medium',
          })
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = conversation.id;
      }

      // 5. Create message from spam log with HTML support
      // Extract full content from raw_payload if available
      const fullHtml = entry.raw_payload?.data?.html;
      const fullText = entry.raw_payload?.data?.text;
      
      // Detect if content is HTML
      const messageContent = fullText || entry.message_preview || '(Email content not available)';
      const hasHtmlContent = !!fullHtml || 
        (entry.message_preview?.includes('<html') || 
         entry.message_preview?.includes('<body') || 
         entry.message_preview?.includes('<div') ||
         entry.message_preview?.includes('<table'));

      const { error: msgError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          content: messageContent,
          sender_type: 'customer',
          sender_id: null,
          metadata: hasHtmlContent ? {
            has_html: true,
            html_content: fullHtml || entry.message_preview,
            email_from: entry.from_email,
          } : {
            email_from: entry.from_email,
          },
        });

      if (msgError) throw msgError;

      // 6. Delete from spam log
      await supabase
        .from('spam_log')
        .delete()
        .eq('id', entry.id);

      toast({
        title: 'Email recovered',
        description: conversationId && existingConversations?.some(c => c.id === conversationId)
          ? `Message added to existing conversation`
          : `${senderEmail} has been whitelisted and conversation created`,
      });

      // Refresh the spam log
      refetchSpamLog();
    } catch (error) {
      console.error('Error marking as not spam:', error);
      toast({
        title: 'Error',
        description: 'Failed to recover email',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    try {
      await supabase
        .from('spam_log')
        .delete()
        .eq('id', id);

      toast({
        title: 'Deleted',
        description: 'Spam entry has been removed',
      });

      refetchSpamLog();
    } catch (error) {
      console.error('Error deleting spam entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete spam entry',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="bg-white border-[#E5E7EB] shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Spam Inbox
              </CardTitle>
              <CardDescription className="text-[#6B7280]">
                Review blocked emails and recover false positives
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg text-[#374151] border-[#D1D5DB] bg-[#F9FAFB]">
              {spamLog.length} blocked
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {spamLog.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-[#D1D5DB] mb-4" />
              <p className="text-[#6B7280]">No spam emails blocked</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E7EB]">
                    <TableHead className="text-[#6B7280]">Time</TableHead>
                    <TableHead className="text-[#6B7280]">From</TableHead>
                    <TableHead className="text-[#6B7280]">Subject</TableHead>
                    <TableHead className="text-[#6B7280]">Matched Rules</TableHead>
                    <TableHead className="text-right text-[#6B7280]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spamLog.map((entry) => (
                    <TableRow key={entry.id} className="border-[#E5E7EB] hover:bg-[#F9FAFB]">
                      <TableCell className="text-sm text-[#6B7280] whitespace-nowrap">
                        <div className="text-[#374151]">{format(new Date(entry.created_at), 'MMM d')}</div>
                        <div className="text-xs text-[#9CA3AF]">{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium truncate text-[#1A1A1A]">{extractName(entry.from_email) || 'Unknown'}</div>
                          <div className="text-xs text-[#6B7280] truncate">{extractEmail(entry.from_email)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="font-medium truncate text-[#1A1A1A]">{entry.subject || '(No subject)'}</div>
                        {entry.message_preview && (
                          <div className="text-xs text-[#6B7280] truncate">{entry.message_preview.substring(0, 60)}...</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {entry.matched_rules?.slice(0, 2).map((rule, i) => (
                            <Badge key={i} variant="secondary" className="text-xs truncate max-w-[90px] bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]">
                              {rule}
                            </Badge>
                          ))}
                          {(entry.matched_rules?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs text-[#6B7280] border-[#D1D5DB]">
                              +{(entry.matched_rules?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]"
                            onClick={() => handleMarkAsNotSpam(entry)}
                            disabled={processingId === entry.id || whitelistSaving}
                          >
                            {processingId === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 mr-1 text-emerald-600" />
                                Not Spam
                              </>
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-red-50"
                                disabled={processingId === entry.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white text-[#1A1A1A]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-[#1A1A1A]">Delete spam entry?</AlertDialogTitle>
                                <AlertDialogDescription className="text-[#6B7280]">
                                  This will permanently delete this spam log entry. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white text-[#374151] border-[#D1D5DB]">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600" onClick={() => handleDelete(entry.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
