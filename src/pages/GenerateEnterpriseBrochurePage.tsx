import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw, Image, CheckCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import logo from "@/assets/logo.png";

interface PageConfig {
  id: string;
  title: string;
  prompt: string;
}

const brochurePages: PageConfig[] = [
  {
    id: "cover",
    title: "Cover Page",
    prompt: "Professional corporate brochure cover for Mobile11 Enterprise eSIM Solutions. Features diverse group of 2-3 confident business executives - include Asian professional (Thai or Japanese woman in elegant business attire), European businessman, and African-American executive - in modern glass office with holographic world map showing global connectivity. Emerald green (#10B981) to teal (#0891B2) gradient accents. Futuristic glowing eSIM chip floating nearby. Dark premium background with subtle geometric patterns. Clean space at top for title and bottom for tagline. Ultra high resolution, magazine quality, corporate photography style. No text in image."
  },
  {
    id: "benefits",
    title: "Why Choose Us",
    prompt: "Corporate infographic page background for enterprise connectivity benefits. Split layout: left side shows multinational business team of 5-6 people in premium boardroom including Asian professionals (Thai female executive in silk blouse, Korean businessman), Indian colleague, European woman, and American man, global video conference on large screen showing world map. Right side has clean white/dark gradient space for content. Emerald green accent lines and geometric shapes. Professional, trustworthy atmosphere. Clean areas for 4 benefit sections with icons. Ultra high resolution, business presentation style. No text in image."
  },
  {
    id: "features",
    title: "Solution Features",
    prompt: "Futuristic enterprise dashboard visualization for eSIM management platform. Shows sleek admin interface with real-time connectivity analytics, team member cards showing diverse faces (Asian, European, African), usage graphs, and global coverage map. Emerald green (#10B981) and teal (#0891B2) color scheme on dark background. Multiple floating holographic UI panels. Clean space on left for feature list. Ultra high resolution, tech product visualization style. No text in image."
  },
  {
    id: "usecases",
    title: "Use Cases",
    prompt: "4-panel collage showing enterprise eSIM use cases with diverse multinational professionals: Top-left: Asian business executive (Chinese or Thai woman in professional attire) at airport lounge using laptop. Top-right: Multinational sales team including Korean man, European woman, and African colleague on video conference call. Bottom-left: Indian or Middle Eastern remote worker at scenic mountain location with laptop. Bottom-right: Diverse media production crew including Japanese cameraman and European producer with equipment on location. Each panel has emerald green frame accent. Professional photography, warm lighting, aspirational business lifestyle. Ultra high resolution. No text in image."
  },
  {
    id: "contact",
    title: "Contact & CTA",
    prompt: "Premium corporate contact page background. Bangkok skyline at golden hour/sunset with modern skyscrapers including Mahanakhon tower reflecting warm light. In foreground show diverse pair of business professionals - Asian Thai businessman and European businesswoman - shaking hands in silhouette. Glassmorphism translucent card area in center-right for contact details. Emerald green to teal gradient accent bar at bottom. Mobile11 brand colors subtly integrated. Clean professional atmosphere suggesting global business presence. Large clean space for contact information and CTA button. Ultra high resolution, architectural photography style. No text in image."
  }
];

// Overlay text and elements on generated image using Canvas
const createPageWithOverlay = async (
  baseImageUrl: string,
  pageId: string,
  logoImg: HTMLImageElement | null
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
      // A4 aspect ratio (210x297mm) - use high resolution
      const targetWidth = 2100;
      const targetHeight = 2970;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Draw and scale base image to fill canvas
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Add dark overlay for text readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      // Add page-specific overlays
      switch (pageId) {
        case 'cover':
          addCoverOverlay(ctx, targetWidth, targetHeight, logoImg);
          break;
        case 'benefits':
          addBenefitsOverlay(ctx, targetWidth, targetHeight, logoImg);
          break;
        case 'features':
          addFeaturesOverlay(ctx, targetWidth, targetHeight, logoImg);
          break;
        case 'usecases':
          addUseCasesOverlay(ctx, targetWidth, targetHeight, logoImg);
          break;
        case 'contact':
          addContactOverlay(ctx, targetWidth, targetHeight, logoImg);
          break;
      }
      
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = baseImageUrl;
  });
};

// Helper to draw text with shadow
const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    font?: string;
    color?: string;
    align?: CanvasTextAlign;
    shadow?: boolean;
    maxWidth?: number;
  } = {}
) => {
  const { font = '60px Arial', color = 'white', align = 'left', shadow = true, maxWidth } = options;
  
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  
  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
  }
  
  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

// Draw rounded rectangle
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: string
) => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fillColor;
  ctx.fill();
};

const addCoverOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  logoImg: HTMLImageElement | null
) => {
  // Add logo at top
  if (logoImg) {
    const logoHeight = 180;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    ctx.drawImage(logoImg, 120, 120, logoWidth, logoHeight);
  }
  
  // Main title
  drawText(ctx, 'MOBILE11', width / 2, height * 0.35, {
    font: 'bold 200px Arial',
    align: 'center'
  });
  
  drawText(ctx, 'ENTERPRISE SOLUTIONS', width / 2, height * 0.35 + 220, {
    font: '80px Arial',
    color: '#10B981',
    align: 'center'
  });
  
  // Tagline
  drawText(ctx, 'Global Connectivity for Modern Business', width / 2, height * 0.55, {
    font: '60px Arial',
    align: 'center'
  });
  
  // Stats boxes
  const boxY = height * 0.7;
  const boxWidth = 450;
  const boxHeight = 200;
  const boxGap = 80;
  const startX = (width - (boxWidth * 3 + boxGap * 2)) / 2;
  
  const stats = [
    { value: '151', label: 'Countries' },
    { value: '200+', label: 'Carrier Partners' },
    { value: '4,500+', label: 'Enterprise Clients' }
  ];
  
  stats.forEach((stat, i) => {
    const x = startX + i * (boxWidth + boxGap);
    drawRoundedRect(ctx, x, boxY, boxWidth, boxHeight, 20, 'rgba(16, 185, 129, 0.3)');
    
    drawText(ctx, stat.value, x + boxWidth / 2, boxY + 40, {
      font: 'bold 80px Arial',
      align: 'center'
    });
    
    drawText(ctx, stat.label, x + boxWidth / 2, boxY + 130, {
      font: '36px Arial',
      color: '#a0aec0',
      align: 'center'
    });
  });
  
  // Footer
  drawText(ctx, 'www.mobile11.com', width / 2, height - 150, {
    font: '40px Arial',
    color: '#10B981',
    align: 'center'
  });
};

const addBenefitsOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  logoImg: HTMLImageElement | null
) => {
  // Header
  if (logoImg) {
    const logoHeight = 100;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    ctx.drawImage(logoImg, 120, 80, logoWidth, logoHeight);
  }
  
  drawText(ctx, 'Why Choose Mobile11?', 120, 250, {
    font: 'bold 100px Arial'
  });
  
  // Benefits
  const benefits = [
    { num: '01', title: 'Global Coverage', desc: 'Instant connectivity in 151 countries with 200+ carrier partnerships' },
    { num: '02', title: 'Enterprise Control', desc: 'Centralized dashboard to manage all team eSIMs in real-time' },
    { num: '03', title: 'Truly Unlimited Data', desc: 'No throttling, no caps - peace of mind for your traveling teams' },
    { num: '04', title: 'Instant Deployment', desc: 'Activate new eSIMs in under 30 seconds via QR code' }
  ];
  
  const startY = 450;
  const itemHeight = 500;
  
  benefits.forEach((benefit, i) => {
    const y = startY + i * itemHeight;
    
    // Number circle
    ctx.beginPath();
    ctx.arc(200, y + 80, 70, 0, Math.PI * 2);
    ctx.fillStyle = '#10B981';
    ctx.fill();
    
    drawText(ctx, benefit.num, 200, y + 45, {
      font: 'bold 50px Arial',
      align: 'center',
      shadow: false
    });
    
    // Title and description
    drawText(ctx, benefit.title, 320, y + 30, {
      font: 'bold 70px Arial'
    });
    
    drawText(ctx, benefit.desc, 320, y + 120, {
      font: '44px Arial',
      color: '#cbd5e0',
      maxWidth: width - 450
    });
  });
  
  // Footer line
  ctx.fillStyle = '#10B981';
  ctx.fillRect(120, height - 120, width - 240, 4);
};

const addFeaturesOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  logoImg: HTMLImageElement | null
) => {
  // Header
  if (logoImg) {
    const logoHeight = 100;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    ctx.drawImage(logoImg, 120, 80, logoWidth, logoHeight);
  }
  
  drawText(ctx, 'Solution Features', 120, 250, {
    font: 'bold 100px Arial'
  });
  
  // Two-column features
  const leftFeatures = [
    '✓ Real-time usage monitoring',
    '✓ Team member management',
    '✓ Bulk eSIM provisioning',
    '✓ Custom data allocations'
  ];
  
  const rightFeatures = [
    '✓ Automated billing reports',
    '✓ 24/7 priority support',
    '✓ API integration available',
    '✓ White-label options'
  ];
  
  const colY = 450;
  const lineHeight = 120;
  
  leftFeatures.forEach((feature, i) => {
    drawText(ctx, feature, 150, colY + i * lineHeight, {
      font: '52px Arial'
    });
  });
  
  rightFeatures.forEach((feature, i) => {
    drawText(ctx, feature, width / 2 + 100, colY + i * lineHeight, {
      font: '52px Arial'
    });
  });
  
  // Plan options section
  const planY = colY + leftFeatures.length * lineHeight + 200;
  
  drawText(ctx, 'Flexible Plans', 120, planY, {
    font: 'bold 70px Arial',
    color: '#10B981'
  });
  
  const plans = [
    { name: 'Limitless', desc: 'Full 5G speed, truly unlimited' },
    { name: 'Max Speed', desc: 'High-speed priority data + backup connectivity' },
    { name: 'Day Pass', desc: 'Daily high-speed allowance, always connected' }
  ];
  
  const planStartY = planY + 120;
  const planBoxWidth = (width - 300) / 3;
  
  plans.forEach((plan, i) => {
    const x = 120 + i * (planBoxWidth + 30);
    
    drawRoundedRect(ctx, x, planStartY, planBoxWidth, 280, 20, 'rgba(16, 185, 129, 0.2)');
    
    drawText(ctx, plan.name, x + planBoxWidth / 2, planStartY + 50, {
      font: 'bold 56px Arial',
      align: 'center'
    });
    
    drawText(ctx, plan.desc, x + planBoxWidth / 2, planStartY + 140, {
      font: '36px Arial',
      color: '#a0aec0',
      align: 'center',
      maxWidth: planBoxWidth - 40
    });
  });
  
  // Footer
  ctx.fillStyle = '#10B981';
  ctx.fillRect(120, height - 120, width - 240, 4);
};

const addUseCasesOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  logoImg: HTMLImageElement | null
) => {
  // Header
  if (logoImg) {
    const logoHeight = 100;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    ctx.drawImage(logoImg, 120, 80, logoWidth, logoHeight);
  }
  
  drawText(ctx, 'Enterprise Use Cases', 120, 250, {
    font: 'bold 100px Arial'
  });
  
  // Use case cards in 2x2 grid
  const useCases = [
    { icon: '✈️', title: 'Executive Travel', desc: 'Keep leadership connected during international business trips' },
    { icon: '🌍', title: 'Global Sales Teams', desc: 'Seamless connectivity for remote sales across regions' },
    { icon: '💻', title: 'Remote Workforce', desc: 'Enable work-from-anywhere with reliable data access' },
    { icon: '🎬', title: 'Media & Production', desc: 'On-location connectivity for film and media crews' }
  ];
  
  const gridStartY = 450;
  const cardWidth = (width - 300) / 2;
  const cardHeight = 450;
  const gap = 60;
  
  useCases.forEach((useCase, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 120 + col * (cardWidth + gap);
    const y = gridStartY + row * (cardHeight + gap);
    
    drawRoundedRect(ctx, x, y, cardWidth, cardHeight, 30, 'rgba(0, 0, 0, 0.6)');
    
    // Icon
    drawText(ctx, useCase.icon, x + 60, y + 50, {
      font: '100px Arial',
      shadow: false
    });
    
    // Title
    drawText(ctx, useCase.title, x + 60, y + 200, {
      font: 'bold 56px Arial'
    });
    
    // Description
    drawText(ctx, useCase.desc, x + 60, y + 290, {
      font: '40px Arial',
      color: '#a0aec0',
      maxWidth: cardWidth - 120
    });
  });
  
  // Testimonial section
  const testY = gridStartY + 2 * (cardHeight + gap) + 80;
  
  drawRoundedRect(ctx, 120, testY, width - 240, 300, 20, 'rgba(16, 185, 129, 0.15)');
  
  drawText(ctx, '"Mobile11 reduced our roaming costs by 70% while improving connectivity reliability."', 180, testY + 60, {
    font: 'italic 48px Arial',
    maxWidth: width - 400
  });
  
  drawText(ctx, '— IT Director, Fortune 500 Company', 180, testY + 200, {
    font: '40px Arial',
    color: '#10B981'
  });
};

const addContactOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  logoImg: HTMLImageElement | null
) => {
  // Large logo centered
  if (logoImg) {
    const logoHeight = 200;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    ctx.drawImage(logoImg, (width - logoWidth) / 2, 150, logoWidth, logoHeight);
  }
  
  // Main CTA
  drawText(ctx, 'Ready to Connect', width / 2, height * 0.3, {
    font: 'bold 120px Arial',
    align: 'center'
  });
  
  drawText(ctx, 'Your Global Workforce?', width / 2, height * 0.3 + 140, {
    font: 'bold 120px Arial',
    align: 'center'
  });
  
  // Contact card
  const cardX = (width - 1200) / 2;
  const cardY = height * 0.5;
  const cardWidth = 1200;
  const cardHeight = 600;
  
  // Glassmorphism card
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 40);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Contact details
  const contactY = cardY + 80;
  const lineHeight = 100;
  
  drawText(ctx, '📧  enterprise@mobile11.com', cardX + 100, contactY, {
    font: '52px Arial'
  });
  
  drawText(ctx, '🌐  www.mobile11.com/business', cardX + 100, contactY + lineHeight, {
    font: '52px Arial'
  });
  
  drawText(ctx, '📍  Bangkok, Thailand', cardX + 100, contactY + lineHeight * 2, {
    font: '52px Arial'
  });
  
  // CTA Button
  const btnY = contactY + lineHeight * 3 + 40;
  const btnWidth = 600;
  const btnHeight = 100;
  const btnX = cardX + (cardWidth - btnWidth) / 2;
  
  // Green gradient button
  const gradient = ctx.createLinearGradient(btnX, btnY, btnX + btnWidth, btnY);
  gradient.addColorStop(0, '#10B981');
  gradient.addColorStop(1, '#0891B2');
  
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 50);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  drawText(ctx, 'Request a Demo', btnX + btnWidth / 2, btnY + 25, {
    font: 'bold 48px Arial',
    align: 'center',
    shadow: false
  });
  
  // Footer
  drawText(ctx, '© 2025 Mobile11 by 1-TO-ALL. All rights reserved.', width / 2, height - 120, {
    font: '36px Arial',
    color: '#718096',
    align: 'center'
  });
};

const GenerateEnterpriseBrochurePage = () => {
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [allComplete, setAllComplete] = useState(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Preload logo
  useEffect(() => {
    const img = new window.Image();
    img.src = logo;
    img.onload = () => setLogoImage(img);
  }, []);

  const generateImage = useCallback(async (config: PageConfig) => {
    const { id, prompt } = config;
    setLoading((prev) => ({ ...prev, [id]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-esim-image', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        // Apply overlay with text
        const finalImage = await createPageWithOverlay(data.imageUrl, id, logoImage);
        setGeneratedImages((prev) => ({ ...prev, [id]: finalImage }));
      }
    } catch (error) {
      console.error(`Error generating ${id}:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  }, [logoImage]);

  const generateAll = useCallback(async () => {
    if (!logoImage) return;
    
    setGeneratedImages({});
    for (const config of brochurePages) {
      await generateImage(config);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Rate limit
    }
  }, [generateImage, logoImage]);

  useEffect(() => {
    if (logoImage && Object.keys(generatedImages).length === 0) {
      generateAll();
    }
  }, [logoImage]);

  useEffect(() => {
    const allGenerated = brochurePages.every((page) => generatedImages[page.id]);
    setAllComplete(allGenerated);
  }, [generatedImages]);

  const downloadImage = (id: string, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `brochure-${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePdf = async () => {
    if (!allComplete) return;
    
    setGeneratingPdf(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = 210;
      const pageHeight = 297;
      
      for (let i = 0; i < brochurePages.length; i++) {
        const page = brochurePages[i];
        const imageData = generatedImages[page.id];
        
        if (i > 0) {
          doc.addPage();
        }
        
        // Add full-page image
        doc.addImage(imageData, 'JPEG', 0, 0, pageWidth, pageHeight);
      }
      
      doc.save('Mobile11-Enterprise-Brochure.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">Enterprise Brochure Generator</h1>
              <Badge variant="default" className="bg-primary">AI-Powered</Badge>
            </div>
            <p className="text-muted-foreground">
              Generate stunning 5-page PDF brochure with AI images + text overlays
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={generateAll}
              disabled={!logoImage || Object.values(loading).some(Boolean)}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
              Regenerate All
            </Button>
            <Button 
              onClick={generatePdf} 
              disabled={!allComplete || generatingPdf}
              className="gap-2"
            >
              {generatingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Download PDF
            </Button>
          </div>
        </div>

        {allComplete && (
          <Alert className="mb-6 border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              All 5 pages generated! Click "Download PDF" to get your brochure.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brochurePages.map((page) => (
            <Card key={page.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Page {brochurePages.indexOf(page) + 1}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateImage(page)}
                      disabled={loading[page.id] || !logoImage}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading[page.id] ? 'animate-spin' : ''}`} />
                    </Button>
                    {generatedImages[page.id] && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(page.id, generatedImages[page.id])}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-[210/297] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {!logoImage ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-sm">Loading assets...</span>
                    </div>
                  ) : loading[page.id] ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-sm">Generating with AI...</span>
                    </div>
                  ) : generatedImages[page.id] ? (
                    <img
                      src={generatedImages[page.id]}
                      alt={page.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Image className="h-8 w-8" />
                      <span className="text-sm">Waiting...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenerateEnterpriseBrochurePage;
