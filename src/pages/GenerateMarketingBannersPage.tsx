import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw, Image, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";

interface BannerConfig {
  filename: string;
  dimensions: string;
  width: number;
  height: number;
  prompt: string;
  thaiTextLines?: { text: string; y: number; fontSize: number; fontWeight: string }[];
}

// Thai text overlay configuration for each banner type
const getThaiTextConfig = (width: number, height: number, bannerType: string) => {
  switch (bannerType) {
    case 'leaderboard':
      return [
        { text: 'เน็ตไม่อั้นใน 151 ประเทศ', y: height * 0.55, fontSize: Math.min(32, height * 0.4), fontWeight: '700' }
      ];
    case 'square':
      return [
        { text: 'เชื่อมต่อได้ทุกที่', y: height * 0.15, fontSize: Math.min(72, width * 0.08), fontWeight: '800' },
        { text: 'เน็ตไม่อั้น 151 ประเทศ', y: height * 0.85, fontSize: Math.min(48, width * 0.05), fontWeight: '600' }
      ];
    case 'social':
      return [
        { text: 'เดินทางพร้อมเน็ต', y: height * 0.4, fontSize: Math.min(64, width * 0.055), fontWeight: '800' },
        { text: 'เน็ตไม่อั้นทั่วโลก', y: height * 0.55, fontSize: Math.min(48, width * 0.04), fontWeight: '600' }
      ];
    case 'story':
      return [
        { text: 'เปิดใช้งานใน 30 วินาที', y: height * 0.12, fontSize: Math.min(48, width * 0.045), fontWeight: '600' },
        { text: 'เน็ตไม่อั้น', y: height * 0.5, fontSize: Math.min(72, width * 0.07), fontWeight: '800' },
        { text: 'สไลด์ขึ้นเพื่อเริ่มต้น', y: height * 0.92, fontSize: Math.min(36, width * 0.035), fontWeight: '500' }
      ];
    default:
      return [];
  }
};

// Add overlays (logo + optional Thai text) to base image using Canvas
const addOverlays = (
  baseImageUrl: string,
  width: number,
  height: number,
  logoImg: HTMLImageElement | null,
  textConfig?: { text: string; y: number; fontSize: number; fontWeight: string }[]
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw base image
      ctx.drawImage(img, 0, 0);
      
      // Add logo in bottom-left corner (ALL banners)
      if (logoImg) {
        const logoMaxHeight = img.height * 0.12; // 12% of banner height
        const logoAspectRatio = logoImg.width / logoImg.height;
        const logoHeight = Math.min(logoMaxHeight, img.height * 0.15);
        const logoWidth = logoHeight * logoAspectRatio;
        const logoX = img.width * 0.03; // 3% padding from left
        const logoY = img.height - logoHeight - (img.height * 0.05); // 5% padding from bottom
        
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
      }
      
      // Add Thai text overlay (if applicable)
      if (textConfig && textConfig.length > 0) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        textConfig.forEach(({ text, y, fontSize, fontWeight }) => {
          const scaledFontSize = (fontSize * img.width) / width;
          const scaledY = (y * img.height) / height;
          
          ctx.font = `${fontWeight} ${scaledFontSize}px "IBM Plex Sans Thai", "Sarabun", sans-serif`;
          
          // Add text shadow for better readability
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = scaledFontSize * 0.1;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          // White text
          ctx.fillStyle = 'white';
          ctx.fillText(text, canvas.width / 2, scaledY);
          
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        });
      }
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = baseImageUrl;
  });
};

const GenerateMarketingBannersPage = () => {
  const { language } = useLanguage();
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [allComplete, setAllComplete] = useState(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

  // Preload logo on mount
  useEffect(() => {
    const img = new window.Image();
    img.src = logo;
    img.onload = () => setLogoImage(img);
  }, []);

  const bannerPrompts = useMemo((): BannerConfig[] => {
    const isThaiLanguage = language === 'th';
    
    return [
      {
        filename: `banner-leaderboard-${language}.png`,
        dimensions: "728x90",
        width: 728,
        height: 90,
        prompt: isThaiLanguage
          ? "Wide horizontal leaderboard banner (728x90 aspect ratio) for eSIM travel service. Features emerald green (#10B981) to teal blue (#0891B2) gradient background with subtle world map pattern. Clean center area reserved for text overlay, no text in image, no logo in image. Small airplane icon with dotted trail across the banner. Clean modern minimalist design, professional marketing banner style."
          : "Wide horizontal leaderboard banner (728x90 aspect ratio) for eSIM travel service. Features emerald green (#10B981) to teal blue (#0891B2) gradient background with subtle world map pattern. Text 'Unlimited Data in 151 Countries' in bold white sans-serif font, no logo in image. Small airplane icon with dotted trail across the banner. Clean modern minimalist design, professional marketing banner style.",
        thaiTextLines: isThaiLanguage ? getThaiTextConfig(728, 90, 'leaderboard') : undefined
      },
      {
        filename: `banner-square-${language}.png`,
        dimensions: "1024x1024",
        width: 1024,
        height: 1024,
        prompt: isThaiLanguage
          ? "Square promotional banner for Mobile11 eSIM service. Features a modern smartphone displaying a QR code for eSIM activation at center. Background has emerald green to teal blue gradient with abstract global connectivity lines and dots. Clean areas at top and bottom reserved for text overlay, no text in image, no logo in image. Icons showing WiFi, globe, and signal strength. Professional clean design with plenty of white space, marketing banner style."
          : "Square promotional banner for Mobile11 eSIM service. Features a modern smartphone displaying a QR code for eSIM activation. Background has emerald green to teal blue gradient with abstract global connectivity lines and dots. Text 'Stay Connected Anywhere' as headline, no logo in image. Icons showing WiFi, globe, and signal strength. Professional clean design with plenty of white space, marketing banner style.",
        thaiTextLines: isThaiLanguage ? getThaiTextConfig(1024, 1024, 'square') : undefined
      },
      {
        filename: `banner-social-${language}.png`,
        dimensions: "1200x630",
        width: 1200,
        height: 630,
        prompt: isThaiLanguage
          ? "Social media share card (1200x630 Facebook/Twitter format) for travel eSIM service. Shows diverse happy travelers at airport using smartphones. Semi-transparent dark gradient overlay for text readability, clean center area reserved for text overlay, no text in image, no logo in image. Emerald green to teal gradient accent bar at bottom. Clean modern design, warm lighting, aspirational travel photography feel, professional marketing banner."
          : "Social media share card (1200x630 Facebook/Twitter format) for travel eSIM service. Shows diverse happy travelers at airport using smartphones. Overlay with 'Travel Connected - Unlimited Data Worldwide' text in white, no logo in image. Emerald green to teal gradient accent bar at bottom. Clean modern design, warm lighting, aspirational travel photography feel, professional marketing banner.",
        thaiTextLines: isThaiLanguage ? getThaiTextConfig(1200, 630, 'social') : undefined
      },
      {
        filename: `banner-story-${language}.png`,
        dimensions: "1080x1920",
        width: 1080,
        height: 1920,
        prompt: isThaiLanguage
          ? "Vertical story format banner (9:16 aspect ratio) for eSIM travel service. Features a traveler at iconic landmark (Eiffel Tower or similar) holding phone with eSIM QR code visible on screen. Semi-transparent dark gradient overlay for text readability, clean areas at top, center, and bottom reserved for text overlay, no text in image, no logo in image. Emerald green to teal gradient elements, vibrant colors, Instagram story style, professional marketing design."
          : "Vertical story format banner (9:16 aspect ratio) for eSIM travel service. Features a traveler at iconic landmark (Eiffel Tower or similar) holding phone with eSIM QR code visible on screen. Text 'Activate in Seconds' at top, 'Unlimited Data' in middle, 'Swipe Up to Get Started' at bottom, no logo in image. Emerald green to teal gradient elements, vibrant colors, Instagram story style, professional marketing design.",
        thaiTextLines: isThaiLanguage ? getThaiTextConfig(1080, 1920, 'story') : undefined
      }
    ];
  }, [language]);

  const generateImage = useCallback(async (config: BannerConfig) => {
    const { filename, prompt, thaiTextLines, width, height } = config;
    setLoading((prev) => ({ ...prev, [filename]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-esim-image', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        let finalImageUrl = data.imageUrl;
        
        // Apply overlays to ALL banners (logo always, text for Thai only)
        try {
          finalImageUrl = await addOverlays(
            data.imageUrl, 
            width, 
            height, 
            logoImage,
            thaiTextLines
          );
        } catch (overlayError) {
          console.error('Overlay failed, using base image:', overlayError);
        }
        
        setGeneratedImages((prev) => ({ ...prev, [filename]: finalImageUrl }));
      }
    } catch (error) {
      console.error(`Error generating ${filename}:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [filename]: false }));
    }
  }, [logoImage]);

  const generateAll = useCallback(async () => {
    // Wait for logo to load before generating
    if (!logoImage) {
      console.log('Waiting for logo to load...');
      return;
    }
    
    setGeneratedImages({});
    for (const config of bannerPrompts) {
      await generateImage(config);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }, [bannerPrompts, generateImage, logoImage]);

  // Regenerate when language changes or logo loads
  useEffect(() => {
    if (logoImage) {
      setGeneratedImages({});
      setAllComplete(false);
      generateAll();
    }
  }, [language, logoImage, generateAll]);

  useEffect(() => {
    const allGenerated = bannerPrompts.every(
      (item) => generatedImages[item.filename]
    );
    setAllComplete(allGenerated);
  }, [generatedImages, bannerPrompts]);

  const downloadImage = (filename: string, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = () => {
    bannerPrompts.forEach((item) => {
      const dataUrl = generatedImages[item.filename];
      if (dataUrl) {
        downloadImage(item.filename, dataUrl);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">Marketing Banner Generator</h1>
              <Badge variant={language === 'th' ? 'default' : 'secondary'} className="text-sm">
                {language === 'th' ? 'ภาษาไทย' : 'English'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              AI generates base image → Canvas adds Mobile11 logo{language === 'th' ? ' + Thai text overlay' : ''}.
              {' '}Switch language in the header to generate {language === 'th' ? 'English' : 'Thai'} versions.
            </p>
          </div>
          <Button 
            onClick={downloadAllImages} 
            disabled={!allComplete}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download All ({language.toUpperCase()})
          </Button>
        </div>

        {allComplete && (
          <Alert className="mb-6 border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              All {language === 'th' ? 'Thai' : 'English'} banners generated with Mobile11 logo! Download them to replace files in src/assets/banners/
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bannerPrompts.map((item) => (
            <Card key={item.filename} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.filename}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{item.dimensions}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateImage(item)}
                      disabled={loading[item.filename] || !logoImage}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading[item.filename] ? 'animate-spin' : ''}`} />
                    </Button>
                    {generatedImages[item.filename] && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(item.filename, generatedImages[item.filename])}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {!logoImage ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-sm">Loading logo...</span>
                    </div>
                  ) : loading[item.filename] ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-sm">
                        Generating + adding logo{language === 'th' ? ' & Thai text' : ''}...
                      </span>
                    </div>
                  ) : generatedImages[item.filename] ? (
                    <img
                      src={generatedImages[item.filename]}
                      alt={item.filename}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Image className="h-8 w-8" />
                      <span className="text-sm">Waiting to generate...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                  {item.prompt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenerateMarketingBannersPage;
