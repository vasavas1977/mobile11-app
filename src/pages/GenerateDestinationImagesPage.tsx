import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, RefreshCw, Check, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Iconic location prompts for each destination
const destinationPrompts = [
  {
    id: 'thailand',
    name: 'Thailand',
    prompt: 'Golden Wat Arun temple at sunset with Bangkok skyline, warm orange golden hour lighting, travel photography style, square 1:1 aspect ratio, iconic Thai landmark, vibrant colors'
  },
  {
    id: 'europe',
    name: 'Europe',
    prompt: 'Artistic collage featuring Eiffel Tower, Colosseum, and Big Ben landmarks, European architecture mix, warm sunset colors, travel photography, square 1:1 aspect ratio'
  },
  {
    id: 'japan',
    name: 'Japan',
    prompt: 'Mount Fuji with pink cherry blossoms in foreground, traditional Japanese scenery, soft pink and blue colors, peaceful atmosphere, square 1:1 aspect ratio, travel photography'
  },
  {
    id: 'china',
    name: 'China',
    prompt: 'Great Wall of China winding through misty green mountains, dramatic landscape, golden sunrise lighting, aerial view, square 1:1 aspect ratio, travel photography'
  },
  {
    id: 'hongkong-macau',
    name: 'Hong Kong/Macau',
    prompt: 'Hong Kong Victoria Harbour skyline at night with colorful neon lights reflecting on water, modern cityscape, vibrant purple and blue colors, square 1:1 aspect ratio'
  },
  {
    id: 'korea',
    name: 'South Korea',
    prompt: 'Gyeongbokgung Palace with traditional Korean architecture, cherry blossoms, Seoul city backdrop, vibrant spring colors, square 1:1 aspect ratio, travel photography'
  },
  {
    id: 'vietnam',
    name: 'Vietnam',
    prompt: 'Ha Long Bay with limestone karsts and traditional wooden junk boat sailing, emerald green water, misty atmosphere, square 1:1 aspect ratio, travel photography'
  },
  {
    id: 'taiwan',
    name: 'Taiwan',
    prompt: 'Taipei 101 skyscraper at night with traditional red lanterns in foreground, modern meets traditional, city lights, square 1:1 aspect ratio, travel photography'
  },
  {
    id: 'singapore',
    name: 'Singapore',
    prompt: 'Marina Bay Sands hotel with Gardens by the Bay Supertrees at night, futuristic cityscape, purple and teal lighting, square 1:1 aspect ratio, travel photography'
  },
  {
    id: 'malaysia',
    name: 'Malaysia',
    prompt: 'Petronas Twin Towers illuminated at night, Kuala Lumpur skyline, modern glass architecture, city lights, square 1:1 aspect ratio, travel photography'
  },
  {
    id: 'usa',
    name: 'USA',
    prompt: 'Statue of Liberty with New York City Manhattan skyline at sunset, iconic American landmark, golden hour lighting, square 1:1 aspect ratio, travel photography'
  },
  {
    id: 'australia',
    name: 'Australia',
    prompt: 'Sydney Opera House and Harbour Bridge at blue hour, iconic Australian landmarks, water reflections, evening sky, square 1:1 aspect ratio, travel photography'
  },
  {
    id: 'view-all',
    name: 'View All (Global)',
    prompt: 'Abstract world map with glowing connected network dots representing global connectivity, digital visualization, teal emerald and blue gradient colors, modern tech aesthetic, square 1:1 aspect ratio'
  }
];

export default function GenerateDestinationImagesPage() {
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    // Check if all images are generated
    const generatedCount = Object.keys(generatedImages).length;
    setAllComplete(generatedCount === destinationPrompts.length);
  }, [generatedImages]);

  const generateImage = async (id: string, prompt: string) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-esim-image', {
        body: { prompt }
      });

      if (error) throw error;
      
      if (data?.imageUrl) {
        setGeneratedImages(prev => ({ ...prev, [id]: data.imageUrl }));
        toast.success(`Generated image for ${id}`);
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(`Failed to generate ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const generateAll = async () => {
    for (const dest of destinationPrompts) {
      if (!generatedImages[dest.id]) {
        await generateImage(dest.id, dest.prompt);
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const downloadImage = (id: string, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `destination-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${id} image`);
  };

  const downloadAll = () => {
    Object.entries(generatedImages).forEach(([id, url]) => {
      setTimeout(() => downloadImage(id, url), 500);
    });
  };

  const isAnyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Destination Image Generator</h1>
          <p className="text-muted-foreground mb-6">
            Generate iconic location images for Popular Destinations section using Nano Banana AI
          </p>
          
          <div className="flex justify-center gap-4 mb-6">
            <Button 
              onClick={generateAll} 
              disabled={isAnyLoading}
              size="lg"
            >
              {isAnyLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Generate All Images
                </>
              )}
            </Button>
            
            <Button 
              onClick={downloadAll} 
              disabled={!allComplete}
              variant="outline"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Download All ({Object.keys(generatedImages).length}/{destinationPrompts.length})
            </Button>
          </div>

          {allComplete && (
            <Alert className="max-w-xl mx-auto mb-6 bg-green-500/10 border-green-500/20">
              <Check className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600">
                All destination images generated! Download them and place in <code>src/assets/destinations/</code>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {destinationPrompts.map((dest) => (
            <Card key={dest.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{dest.name}</span>
                  {generatedImages[dest.id] && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Done
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3 flex items-center justify-center">
                  {loading[dest.id] ? (
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Generating...</p>
                    </div>
                  ) : generatedImages[dest.id] ? (
                    <img 
                      src={generatedImages[dest.id]} 
                      alt={dest.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">Not generated</p>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {dest.prompt}
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => generateImage(dest.id, dest.prompt)}
                    disabled={loading[dest.id]}
                  >
                    {loading[dest.id] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : generatedImages[dest.id] ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Regenerate
                      </>
                    ) : (
                      'Generate'
                    )}
                  </Button>
                  
                  {generatedImages[dest.id] && (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => downloadImage(dest.id, generatedImages[dest.id])}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-xl font-bold mb-4">How to Use Generated Images</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Generate all images using the button above</li>
            <li>Download each image (or use "Download All")</li>
            <li>Place images in <code className="bg-muted px-2 py-1 rounded">src/assets/destinations/</code> folder</li>
            <li>Name files as: <code className="bg-muted px-2 py-1 rounded">thailand.png</code>, <code className="bg-muted px-2 py-1 rounded">japan.png</code>, etc.</li>
            <li>Update <code className="bg-muted px-2 py-1 rounded">popularDestinations.ts</code> to use image imports</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
