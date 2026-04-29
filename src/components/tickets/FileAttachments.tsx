import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image as ImageIcon, File, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Attachment {
  name: string;
  path: string;
  size: number;
  type: string;
}

interface FileAttachmentsProps {
  attachments: Attachment[];
}

export const FileAttachments = ({ attachments }: FileAttachmentsProps) => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleImageClick = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .createSignedUrl(attachment.path, 60 * 60); // 1 hour expiry
      
      if (error) throw error;
      
      setSelectedImage({ url: data.signedUrl, name: attachment.name });
    } catch (error) {
      console.error('Error loading image:', error);
      toast.error('Failed to load image');
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    setDownloading(attachment.path);
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(attachment.path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  if (attachments.length === 0) return null;

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <>
      <div className="mt-2 space-y-1">
        {attachments.map((attachment, index) => {
          const isImageFile = isImage(attachment.type);
          
          return (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm border"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(attachment.type)}
                <span className="truncate">{attachment.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatFileSize(attachment.size)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isImageFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleImageClick(attachment)}
                    title="View image"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  disabled={downloading === attachment.path}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
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
};
