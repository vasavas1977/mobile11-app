import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const regionPrompts = [
  {
    id: 'europe',
    name: 'Europe',
    prompt: 'Stunning travel photography collage of iconic European landmarks: Eiffel Tower Paris at golden hour, Colosseum Rome, Santorini white buildings with blue domes overlooking the sea, Amsterdam canals with flowers, Barcelona Sagrada Familia, Big Ben London at sunset. Warm golden sunset lighting throughout, artistic cinematic composition, vibrant saturated colors, professional travel photography, 4:3 aspect ratio, ultra high resolution'
  },
  {
    id: 'asia',
    name: 'Asia',
    prompt: 'Beautiful travel photography collage of iconic Asian landmarks: Mount Fuji Japan with cherry blossoms in foreground, Bangkok golden temple Wat Arun at sunrise, Bali rice terraces with morning mist, Singapore Marina Bay Sands skyline at night, Korean traditional Gyeongbokgung palace with colorful hanbok, Vietnamese Ha Long Bay with traditional boats. Vibrant warm colors, golden hour lighting, professional travel photography, 4:3 aspect ratio, ultra high resolution'
  },
  {
    id: 'global',
    name: 'Global',
    prompt: 'Artistic world travel concept showing iconic landmarks from all continents seamlessly blended: Statue of Liberty New York, Eiffel Tower Paris, Sydney Opera House, Machu Picchu Peru, Great Wall of China, African savanna with acacia trees, Dubai Burj Khalifa. Connected with subtle glowing network lines representing global connectivity, warm sunset gradient sky background transitioning from orange to purple, professional travel photography montage, 4:3 aspect ratio, ultra high resolution'
  }
];

export default function GenerateRegionalImagesPage() {
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [allComplete, setAllComplete] = useState(false);

  const generateImage = async (id: string, prompt: string) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-esim-image', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImages(prev => {
          const newImages = { ...prev, [id]: data.imageUrl };
          if (Object.keys(newImages).length === regionPrompts.length) {
            setAllComplete(true);
          }
          return newImages;
        });
        toast.success(`${id} image generated successfully!`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(`Failed to generate ${id} image`);
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const generateAll = async () => {
    for (const region of regionPrompts) {
      if (!generatedImages[region.id]) {
        await generateImage(region.id, region.prompt);
        // Small delay between generations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const downloadImage = (id: string, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${id}-regional.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${id}-regional.png`);
  };

  const downloadAll = () => {
    Object.entries(generatedImages).forEach(([id, url]) => {
      downloadImage(id, url);
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Regional eSIM Image Generator
          </h1>
          <p className="text-muted-foreground">
            Generate AI images for Europe, Asia, and Global regional plans using Nano banana model
          </p>
        </div>

        <div className="flex gap-4 justify-center mb-8">
          <Button 
            onClick={generateAll} 
            disabled={Object.values(loading).some(l => l)}
            size="lg"
          >
            {Object.values(loading).some(l => l) ? (
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
          
          {allComplete && (
            <Button onClick={downloadAll} variant="outline" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {regionPrompts.map((region) => (
            <Card key={region.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{region.name} Regional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {generatedImages[region.id] ? (
                    <img 
                      src={generatedImages[region.id]} 
                      alt={`${region.name} regional`}
                      className="w-full h-full object-cover"
                    />
                  ) : loading[region.id] ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-sm">Generating...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-12 w-12" />
                      <span className="text-sm">Not generated</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3">
                  {region.prompt}
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => generateImage(region.id, region.prompt)}
                    disabled={loading[region.id]}
                    variant="outline"
                    className="flex-1"
                  >
                    {loading[region.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Generate'
                    )}
                  </Button>
                  
                  {generatedImages[region.id] && (
                    <Button
                      onClick={() => downloadImage(region.id, generatedImages[region.id])}
                      variant="secondary"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Click "Generate All Images" to create all 3 regional images</li>
            <li>Wait for each image to generate (may take 10-30 seconds each)</li>
            <li>Download images and save them to <code className="bg-background px-1 rounded">src/assets/regions/</code></li>
            <li>Name files: <code className="bg-background px-1 rounded">europe-regional.png</code>, <code className="bg-background px-1 rounded">asia-regional.png</code>, <code className="bg-background px-1 rounded">global-regional.png</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
