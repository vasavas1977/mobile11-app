import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const imagePrompts = [
  {
    filename: 'what-is-esim-hero.jpg',
    prompt: 'Modern minimalist illustration of smartphone with glowing digital eSIM chip icon floating above it, holographic effect, clean white background, professional tech photography style, soft blue and purple gradient lighting, 16:9 aspect ratio'
  },
  {
    filename: 'esim-how-it-works.jpg',
    prompt: 'Split screen showing smartphone scanning QR code on left and eSIM activating with digital animation on right, hands holding phone, modern clean environment, professional product photography, bright natural lighting, teal and white color scheme'
  },
  {
    filename: 'esim-benefits.jpg',
    prompt: 'Side by side comparison photo showing old plastic SIM card on left versus modern smartphone displaying digital eSIM interface on right, minimal background, professional product photography, clean composition, natural lighting'
  },
  {
    filename: 'esim-compatible-devices.jpg',
    prompt: 'Flat lay arrangement of multiple modern smartphones from different brands (iPhone, Samsung, Google Pixel) displaying eSIM settings screens, organized grid layout, white background, professional product photography, clean and minimalist'
  },
  {
    filename: 'esim-travel.jpg',
    prompt: 'Happy traveler at international airport using smartphone with eSIM connectivity, boarding pass in hand, modern airport terminal background, candid travel photography, natural lighting, warm colors, lifestyle photography style'
  },
  {
    filename: 'esim-qr-activation.jpg',
    prompt: 'Close-up of hands holding smartphone displaying eSIM QR code activation screen, finger about to tap activate button, professional tech photography, shallow depth of field, modern UI interface visible, soft studio lighting'
  }
];

export function GenerateEsimImagesPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [autoStarted, setAutoStarted] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!autoStarted && Object.keys(generatedImages).length === 0) {
      setAutoStarted(true);
      generateAll();
    }
  }, [autoStarted]);

  useEffect(() => {
    if (Object.keys(generatedImages).length === imagePrompts.length) {
      setAllComplete(true);
      toast({
        title: 'All Images Generated!',
        description: 'All 6 images generated with Nano Banana. Download them below.',
      });
    }
  }, [generatedImages]);

  const generateImage = async (filename: string, prompt: string) => {
    setLoading(filename);
    try {
      const { data, error } = await supabase.functions.invoke('generate-esim-image', {
        body: { prompt }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.imageUrl) {
        throw new Error('No image URL in response');
      }

      setGeneratedImages(prev => ({
        ...prev,
        [filename]: data.imageUrl
      }));

      toast({
        title: 'Image Generated',
        description: `${filename} has been generated successfully using Nano Banana (Gemini)`,
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate image',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const generateAll = async () => {
    for (const { filename, prompt } of imagePrompts) {
      await generateImage(filename, prompt);
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const downloadImage = (filename: string, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Downloaded',
      description: `${filename} downloaded successfully`,
    });
  };

  const downloadAllAsZip = async () => {
    // Download all images sequentially
    for (const [filename, dataUrl] of Object.entries(generatedImages)) {
      downloadImage(filename, dataUrl);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Generate eSIM Images with Nano Banana</h1>
          <p className="text-muted-foreground">
            Automated generation using <code className="bg-muted px-1 py-0.5 rounded">google/gemini-2.5-flash-image-preview</code> via Lovable AI Gateway
          </p>
        </div>

        {allComplete && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>
              All 6 images generated successfully! Download each image below and replace the files in <code className="bg-muted px-1 py-0.5 rounded">src/assets/</code>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          {allComplete ? (
            <Button 
              onClick={downloadAllAsZip} 
              size="lg"
              variant="default"
            >
              <Download className="mr-2 h-4 w-4" />
              Download All Images
            </Button>
          ) : (
            <Button 
              disabled
              size="lg"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating with Nano Banana...
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {imagePrompts.map(({ filename, prompt }) => (
            <Card key={filename} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{filename}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {prompt}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedImages[filename] ? (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={generatedImages[filename]} 
                        alt={filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      onClick={() => downloadImage(filename, generatedImages[filename])}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <Button
                      onClick={() => generateImage(filename, prompt)}
                      disabled={loading === filename}
                      variant="outline"
                      className="w-full"
                    >
                      {loading === filename ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
              <p>Page automatically calls the <code className="bg-muted px-1 py-0.5 rounded">generate-esim-image</code> edge function</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
              <p>Edge function uses Lovable AI Gateway with <code className="bg-muted px-1 py-0.5 rounded">google/gemini-2.5-flash-image-preview</code> (Nano Banana)</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
              <p>Images are generated as base64 data and displayed below</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
              <p>Download each image and replace in <code className="bg-muted px-1 py-0.5 rounded">src/assets/</code> folder</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
