import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const imagePrompts = [
  {
    filename: "what-is-esim-hero.jpg",
    prompt: "Create a stunning, modern abstract visualization of eSIM technology. Show a transparent glowing smartphone with digital circuit patterns and holographic SIM card floating above it. Use deep purple, cyan, and emerald gradients. Futuristic, minimal, premium feel. Dark background with subtle particle effects. 16:9 aspect ratio, high detail, professional marketing quality."
  },
  {
    filename: "what-is-esim-qr-activation.jpg",
    prompt: "Modern minimalist illustration of a hand holding a smartphone scanning a holographic QR code. The QR code emits light rays and digital particles. Colors: cyan, emerald green, purple accents on dark background. Clean, tech-forward aesthetic. Professional marketing style."
  },
  {
    filename: "what-is-esim-global-coverage.jpg",
    prompt: "Abstract artistic representation of global connectivity. Earth globe made of glowing network lines and connection nodes. Cyan, green and purple aurora-like light trails wrapping around the planet. Dark space background with stars. Futuristic, premium, minimal style."
  },
  {
    filename: "what-is-esim-devices.jpg",
    prompt: "Modern premium smartphone lineup - iPhone, Samsung Galaxy, Google Pixel floating in dark space. Devices show glowing eSIM activation screens with holographic effects. Subtle particle effects and light rays. Dark gradient background. Professional product photography style, marketing quality."
  },
  {
    filename: "what-is-esim-travel.jpg",
    prompt: "Abstract silhouette of a traveler with backpack at airport, surrounded by glowing digital connection lines and world map overlay. Sunset gradient colors (orange, purple, cyan) transitioning to tech-blue. Modern, inspiring, premium feel. Marketing quality illustration."
  }
];

export default function GenerateWhatIsEsimImages() {
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [allComplete, setAllComplete] = useState(false);

  // Auto-generate all images on mount
  useEffect(() => {
    generateAll();
  }, []);

  // Check if all images are generated
  useEffect(() => {
    const allGenerated = imagePrompts.every(p => generatedImages[p.filename]);
    setAllComplete(allGenerated);
  }, [generatedImages]);

  const generateImage = async (filename: string, prompt: string) => {
    setLoading(prev => ({ ...prev, [filename]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-esim-image', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImages(prev => ({
          ...prev,
          [filename]: data.imageUrl
        }));
        toast.success(`Generated ${filename}`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(`Failed to generate ${filename}`);
    } finally {
      setLoading(prev => ({ ...prev, [filename]: false }));
    }
  };

  const generateAll = async () => {
    for (const { filename, prompt } of imagePrompts) {
      await generateImage(filename, prompt);
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const downloadImage = (filename: string, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${filename}`);
  };

  const downloadAllAsZip = async () => {
    for (const { filename } of imagePrompts) {
      const imageUrl = generatedImages[filename];
      if (imageUrl) {
        downloadImage(filename, imageUrl);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Generate What is eSIM Page Images
          </h1>
          <p className="text-muted-foreground">
            AI-powered image generation for the What is eSIM page using Nano Banana
          </p>
        </div>

        {allComplete && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              All images generated successfully! You can now download them.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button 
            onClick={downloadAllAsZip}
            disabled={!allComplete}
            size="lg"
            className="gap-2"
          >
            <Download className="h-5 w-5" />
            Download All Images
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {imagePrompts.map(({ filename, prompt }) => (
            <Card key={filename} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{filename}</CardTitle>
                <CardDescription className="text-xs line-clamp-3">
                  {prompt}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {loading[filename] ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : generatedImages[filename] ? (
                    <img 
                      src={generatedImages[filename]} 
                      alt={filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Not generated yet
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => generateImage(filename, prompt)}
                    disabled={loading[filename]}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    {loading[filename] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Regenerate"
                    )}
                  </Button>
                  <Button
                    onClick={() => downloadImage(filename, generatedImages[filename])}
                    disabled={!generatedImages[filename]}
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Images are automatically generated on page load using Nano Banana (google/gemini-2.5-flash-image-preview)</p>
            <p>2. Each image is generated with a specific prompt tailored for the What is eSIM page sections</p>
            <p>3. Images are returned as base64 data URLs for immediate preview</p>
            <p>4. Download individual images or all at once</p>
            <p>5. Place downloaded images in <code className="bg-background px-1 rounded">src/assets/</code> folder</p>
            <p>6. Import and use them in WhatIsEsimPage.tsx</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
