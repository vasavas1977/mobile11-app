import { useState, useEffect } from 'react';
import { FileIcon, ImageIcon, FileText, Download, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export interface Attachment {
  name: string;
  url?: string;
  path?: string;
  type: string;
  size: number;
}

interface ChatAttachmentsProps {
  attachments: Attachment[];
  className?: string;
  onRemove?: (index: number) => void;
  removable?: boolean;
  storageBucket?: string;
}

export function ChatAttachments({ 
  attachments, 
  className, 
  onRemove, 
  removable = false,
  storageBucket = 'ticket-attachments'
}: ChatAttachmentsProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string) => type.startsWith('image/');

  const handleImageClick = async (attachment: Attachment) => {
    console.log('[ChatAttachments] handleImageClick called:', {
      name: attachment.name,
      hasUrl: !!attachment.url,
      hasPath: !!attachment.path,
      path: attachment.path,
      storageBucket
    });
    
    try {
      if (attachment.url) {
        console.log('[ChatAttachments] Using direct URL for image view');
        setSelectedImage({ url: attachment.url, name: attachment.name });
      } else if (attachment.path) {
        console.log('[ChatAttachments] Fetching signed URL for image view, path:', attachment.path);
        const { data, error } = await supabase.storage
          .from(storageBucket)
          .createSignedUrl(attachment.path, 60 * 60);
        
        if (error) {
          console.error('[ChatAttachments] Signed URL error:', error);
          throw error;
        }
        console.log('[ChatAttachments] Signed URL obtained:', data.signedUrl.substring(0, 100) + '...');
        setSelectedImage({ url: data.signedUrl, name: attachment.name });
      } else {
        console.warn('[ChatAttachments] No URL or path available for attachment');
        toast.error('No URL or path available for this attachment');
      }
    } catch (error) {
      console.error('[ChatAttachments] Error loading image:', error);
      toast.error('Failed to load image');
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    const key = attachment.path || attachment.url || attachment.name;
    console.log('[ChatAttachments] handleDownload called:', {
      name: attachment.name,
      hasUrl: !!attachment.url,
      hasPath: !!attachment.path,
      path: attachment.path,
      storageBucket
    });
    
    setDownloading(key);
    
    try {
      if (attachment.url) {
        console.log('[ChatAttachments] Opening direct URL in new tab');
        window.open(attachment.url, '_blank');
      } else if (attachment.path) {
        console.log('[ChatAttachments] Downloading from storage, path:', attachment.path);
        const { data, error } = await supabase.storage
          .from(storageBucket)
          .download(attachment.path);

        if (error) {
          console.error('[ChatAttachments] Download error:', error);
          throw error;
        }

        console.log('[ChatAttachments] Download successful, blob size:', data.size);
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('File downloaded');
      } else {
        console.warn('[ChatAttachments] No URL or path available for download');
        toast.error('No URL or path available for this attachment');
      }
    } catch (error) {
      console.error('[ChatAttachments] Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  const getPreviewUrl = async (attachment: Attachment): Promise<string | null> => {
    if (attachment.url) return attachment.url;
    if (attachment.path) {
      const { data, error } = await supabase.storage
        .from(storageBucket)
        .createSignedUrl(attachment.path, 60 * 60);
      if (error) return null;
      return data.signedUrl;
    }
    return null;
  };

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {attachments.map((attachment, index) => {
          const isImageFile = isImage(attachment.type);
          const key = attachment.path || attachment.url || `${attachment.name}-${index}`;
          
          return (
            <div 
              key={key}
              className="flex items-center gap-2 p-2 bg-background/50 rounded-lg border border-border/50"
            >
              {isImageFile ? (
                <button 
                  onClick={() => handleImageClick(attachment)}
                  className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <ImagePreview attachment={attachment} storageBucket={storageBucket} />
                </button>
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                  {getFileIcon(attachment.type)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
              </div>
              
              <div className="flex items-center gap-1">
                {isImageFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleImageClick(attachment)}
                    title="View image"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {removable && onRemove ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => onRemove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleDownload(attachment)}
                    disabled={downloading === key}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center max-h-[70vh] overflow-auto">
            {selectedImage && (
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedImage) {
                  const a = document.createElement('a');
                  a.href = selectedImage.url;
                  a.download = selectedImage.name;
                  a.click();
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Separate component for async image preview loading
function ImagePreview({ attachment, storageBucket }: { attachment: Attachment; storageBucket: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[ImagePreview] Initializing for attachment:', {
      name: attachment.name,
      hasUrl: !!attachment.url,
      hasPath: !!attachment.path,
      path: attachment.path,
      storageBucket
    });

    // Priority: use path for signed URL (most reliable)
    if (attachment.path) {
      setLoading(true);
      setError(null);
      console.log('[ImagePreview] Fetching signed URL for path:', attachment.path);
      
      supabase.storage
        .from(storageBucket)
        .createSignedUrl(attachment.path, 60 * 60)
        .then(({ data, error: signedUrlError }) => {
          if (signedUrlError) {
            console.error('[ImagePreview] Signed URL error:', signedUrlError);
            setError(signedUrlError.message);
            setLoading(false);
            return;
          }
          if (data) {
            console.log('[ImagePreview] Signed URL obtained successfully');
            setPreviewUrl(data.signedUrl);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('[ImagePreview] Unexpected error:', err);
          setError(err.message || 'Unknown error');
          setLoading(false);
        });
    } else if (attachment.url) {
      // For external URLs (legacy Facebook CDN URLs), try to use them but expect they may fail
      console.log('[ImagePreview] Using direct URL (may be expired):', attachment.url.substring(0, 50) + '...');
      setPreviewUrl(attachment.url);
      setLoading(false);
    } else {
      setError('No URL or path available');
      setLoading(false);
    }
  }, [attachment.url, attachment.path, storageBucket, attachment.name]);

  if (loading) {
    return (
      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center" title="Loading preview...">
        <ImageIcon className="h-4 w-4 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-16 h-16 bg-destructive/10 rounded flex items-center justify-center" title={`Error: ${error}`}>
        <ImageIcon className="h-4 w-4 text-destructive" />
      </div>
    );
  }


  return previewUrl ? (
    <img 
      src={previewUrl} 
      alt={attachment.name}
      className="w-16 h-16 object-cover rounded"
      onError={() => {
        console.error('[ImagePreview] Image failed to load, marking as expired');
        setError('Image expired or unavailable');
      }}
    />
  ) : (
    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center" title="No preview available">
      <ImageIcon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
