import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Image, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ImagePrompt {
  id: string;
  filename: string;
  prompt: string;
  category: string;
}

// All images needed for Thai blog articles
const imagePrompts: ImagePrompt[] = [
  // Article 1: eSIM คืออะไร 2025
  {
    id: "esim-what-is-hero-th",
    filename: "esim-what-is-hero-th.jpg",
    prompt: "Modern Thai traveler at Suvarnabhumi Airport holding smartphone showing eSIM QR code activation screen, bright and clean airport terminal background with Thai signage, professional travel photography style, warm lighting, 16:9 aspect ratio, ultra high resolution",
    category: "eSIM คืออะไร"
  },
  {
    id: "esim-vs-sim-comparison-th",
    filename: "esim-vs-sim-comparison-th.jpg",
    prompt: "Split comparison image: left side shows old plastic SIM card with SIM tray and pin tool scattered on table, right side shows modern smartphone with glowing digital eSIM hologram emanating from screen, clean modern aesthetic, tech product photography, 16:9 aspect ratio",
    category: "eSIM คืออะไร"
  },
  {
    id: "esim-compatible-phones-th",
    filename: "esim-compatible-phones-th.jpg",
    prompt: "Collection of modern smartphones (iPhone 15, Samsung Galaxy S24, Google Pixel) arranged aesthetically on marble surface, all showing eSIM settings screens with checkmarks, premium product photography, soft studio lighting, 16:9 aspect ratio",
    category: "eSIM คืออะไร"
  },
  {
    id: "esim-qr-scan-installation-th",
    filename: "esim-qr-scan-installation-th.jpg",
    prompt: "Close-up of Thai person's hands holding smartphone scanning eSIM QR code from laptop screen, cozy home office setting, warm ambient lighting, focus on the scanning action, lifestyle photography, 16:9 aspect ratio",
    category: "eSIM คืออะไร"
  },

  // Article 2: ซิมญี่ปุ่น 2025
  {
    id: "japan-sim-hero-th",
    filename: "japan-sim-hero-th.jpg",
    prompt: "Thai tourist using smartphone for navigation at iconic Shibuya Crossing Tokyo Japan with crowds and neon billboards in background, cherry blossom petals falling, vibrant city atmosphere, travel photography, 16:9 aspect ratio, ultra high resolution",
    category: "ซิมญี่ปุ่น"
  },
  {
    id: "japan-shinkansen-internet-th",
    filename: "japan-shinkansen-internet-th.jpg",
    prompt: "Inside Japanese Shinkansen bullet train, passenger using smartphone with stable 4G signal indicator visible on screen, Mount Fuji visible through window, sleek modern train interior, travel lifestyle photography, 16:9 aspect ratio",
    category: "ซิมญี่ปุ่น"
  },
  {
    id: "japan-kyoto-temple-th",
    filename: "japan-kyoto-temple-th.jpg",
    prompt: "Tourist taking photo with smartphone at Fushimi Inari Shrine Kyoto with famous orange torii gates tunnel, morning golden hour light filtering through gates, beautiful Japanese architecture, travel photography, 16:9 aspect ratio",
    category: "ซิมญี่ปุ่น"
  },
  {
    id: "japan-food-maps-th",
    filename: "japan-food-maps-th.jpg",
    prompt: "Overhead shot of Japanese ramen bowl next to smartphone showing Google Maps restaurant location in Tokyo, chopsticks resting on bowl, steam rising from noodles, food and tech lifestyle photography, 16:9 aspect ratio",
    category: "ซิมญี่ปุ่น"
  },

  // Article 3: โรมมิ่ง vs eSIM 2025
  {
    id: "roaming-vs-esim-hero-th",
    filename: "roaming-vs-esim-hero-th.jpg",
    prompt: "Conceptual split image: left side shows frustrated traveler with expensive phone bill and weak signal bars, right side shows happy traveler with full signal and affordable price tag, airport setting, contrast between stress and relief, 16:9 aspect ratio",
    category: "โรมมิ่ง vs eSIM"
  },
  {
    id: "expensive-roaming-bill-th",
    filename: "expensive-roaming-bill-th.jpg",
    prompt: "Shocked Thai person looking at expensive phone bill on smartphone screen showing high roaming charges, sitting at cafe, expression of surprise and worry, lifestyle photography with dramatic lighting, 16:9 aspect ratio",
    category: "โรมมิ่ง vs eSIM"
  },
  {
    id: "dual-sim-phone-th",
    filename: "dual-sim-phone-th.jpg",
    prompt: "Modern smartphone showing dual SIM settings screen with Thai SIM and eSIM both active, phone floating with glowing interface elements, tech product visualization, clean dark background, 16:9 aspect ratio",
    category: "โรมมิ่ง vs eSIM"
  },
  {
    id: "airport-sim-counter-th",
    filename: "airport-sim-counter-th.jpg",
    prompt: "Long queue of tourists waiting at airport SIM card counter, visible frustration and waiting, contrast with one smart traveler walking past with phone already connected via eSIM, airport terminal setting, 16:9 aspect ratio",
    category: "โรมมิ่ง vs eSIM"
  },

  // Article 4: ซิมต่างประเทศ ยอดนิยม 2025
  {
    id: "travel-sim-hero-th",
    filename: "travel-sim-hero-th.jpg",
    prompt: "World map with glowing connection lines between major tourist destinations (Japan, Korea, Europe, USA, Singapore), smartphone in center with eSIM activated, futuristic global connectivity concept, dark blue and gold color scheme, 16:9 aspect ratio, ultra high resolution",
    category: "ซิมต่างประเทศ"
  },
  {
    id: "korea-travel-sim-th",
    filename: "korea-travel-sim-th.jpg",
    prompt: "Thai tourist taking selfie at Gyeongbokgung Palace Seoul Korea wearing hanbok traditional dress, smartphone with strong signal indicator, beautiful traditional Korean architecture, travel photography, 16:9 aspect ratio",
    category: "ซิมต่างประเทศ"
  },
  {
    id: "europe-travel-sim-th",
    filename: "europe-travel-sim-th.jpg",
    prompt: "Montage of European landmarks (Eiffel Tower, Colosseum, Big Ben) with traveler using smartphone for Google Translate, showing one eSIM works across multiple countries, artistic travel collage style, 16:9 aspect ratio",
    category: "ซิมต่างประเทศ"
  },
  {
    id: "singapore-travel-sim-th",
    filename: "singapore-travel-sim-th.jpg",
    prompt: "Thai tourist at Marina Bay Sands Singapore at night with spectacular light show, using smartphone to capture the moment, city skyline reflection in water, vibrant night photography, 16:9 aspect ratio",
    category: "ซิมต่างประเทศ"
  },
  {
    id: "vietnam-travel-sim-th",
    filename: "vietnam-travel-sim-th.jpg",
    prompt: "Tourist riding motorcycle through Hanoi Old Quarter Vietnam using smartphone GPS navigation, busy street with vendors and traditional architecture, authentic Southeast Asian travel scene, 16:9 aspect ratio",
    category: "ซิมต่างประเทศ"
  },
  {
    id: "china-vpn-sim-th",
    filename: "china-vpn-sim-th.jpg",
    prompt: "Tourist at Great Wall of China using smartphone showing Google Maps and WhatsApp working (VPN included eSIM concept), magnificent wall stretching into misty mountains, travel photography, 16:9 aspect ratio",
    category: "ซิมต่างประเทศ"
  }
];

export default function GenerateThaiBlogImagesPage() {
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [allComplete, setAllComplete] = useState(false);

  // Group images by category
  const categories = [...new Set(imagePrompts.map(p => p.category))];

  const generateImage = useCallback(async (id: string, prompt: string) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-esim-image', {
        body: { prompt }
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setGeneratedImages(prev => ({ ...prev, [id]: data.imageUrl }));
        toast.success(`Generated: ${id}`);
      }
    } catch (error) {
      console.error(`Error generating ${id}:`, error);
      toast.error(`Failed to generate ${id}`);
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  }, []);

  const generateCategory = useCallback(async (category: string) => {
    const categoryImages = imagePrompts.filter(p => p.category === category);
    for (const img of categoryImages) {
      if (!generatedImages[img.id]) {
        await generateImage(img.id, img.prompt);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit delay
      }
    }
  }, [generateImage, generatedImages]);

  const generateAll = useCallback(async () => {
    for (const img of imagePrompts) {
      if (!generatedImages[img.id]) {
        await generateImage(img.id, img.prompt);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }, [generateImage, generatedImages]);

  const downloadImage = (id: string, dataUrl: string) => {
    const filename = imagePrompts.find(p => p.id === id)?.filename || `${id}.jpg`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    Object.entries(generatedImages).forEach(([id, url]) => {
      downloadImage(id, url);
    });
  };

  useEffect(() => {
    const allGenerated = imagePrompts.every(img => generatedImages[img.id]);
    setAllComplete(allGenerated);
  }, [generatedImages]);

  const isAnyLoading = Object.values(loading).some(Boolean);
  const generatedCount = Object.keys(generatedImages).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Generate Thai Blog Images
          </h1>
          <p className="text-muted-foreground">
            AI-generated images for 4 Thai SEO blog articles using Nano Banana model
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Progress: {generatedCount}/{imagePrompts.length} images
            </span>
            {allComplete && (
              <span className="flex items-center gap-1 text-green-500 text-sm">
                <CheckCircle2 className="h-4 w-4" /> All complete!
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <Button 
            onClick={generateAll} 
            disabled={isAnyLoading || allComplete}
            size="lg"
          >
            {isAnyLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Image className="mr-2 h-4 w-4" />
                Generate All ({imagePrompts.length} images)
              </>
            )}
          </Button>
          
          <Button 
            onClick={downloadAll} 
            disabled={generatedCount === 0}
            variant="outline"
            size="lg"
          >
            <Download className="mr-2 h-4 w-4" />
            Download All ({generatedCount})
          </Button>
        </div>

        {categories.map(category => (
          <div key={category} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">{category}</h2>
              <Button
                onClick={() => generateCategory(category)}
                disabled={isAnyLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Generate Category
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {imagePrompts
                .filter(img => img.category === category)
                .map(img => (
                  <Card key={img.id} className="overflow-hidden">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm truncate">{img.filename}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                        {loading[img.id] ? (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : generatedImages[img.id] ? (
                          <img 
                            src={generatedImages[img.id]} 
                            alt={img.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {img.prompt.substring(0, 100)}...
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => generateImage(img.id, img.prompt)}
                          disabled={loading[img.id]}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          {loading[img.id] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : generatedImages[img.id] ? (
                            <RefreshCw className="h-3 w-3" />
                          ) : (
                            "Generate"
                          )}
                        </Button>
                        
                        {generatedImages[img.id] && (
                          <Button
                            onClick={() => downloadImage(img.id, generatedImages[img.id])}
                            size="sm"
                            variant="secondary"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Click "Generate All" to create all 20 images for Thai blog articles</p>
            <p>2. Or generate by category for specific articles</p>
            <p>3. Download images and save to <code className="bg-muted px-1 rounded">src/assets/blog/</code></p>
            <p>4. Update blogArticles.ts to reference the new image paths</p>
            <p className="text-yellow-500">Note: Generation may take 1-2 minutes per image due to rate limits</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
