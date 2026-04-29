import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2, FileDown, X, Image } from 'lucide-react';
import jsPDF from 'jspdf';

interface BrochureGeneratorModalProps {
  open: boolean;
  onClose: () => void;
}

type PageStatus = 'pending' | 'generating' | 'complete' | 'error';

interface BrochurePage {
  id: string;
  name: string;
  status: PageStatus;
  imageUrl?: string;
  finalImageUrl?: string;
}

const BROCHURE_PAGES = [
  { id: 'cover', nameKey: 'cover' },
  { id: 'benefits', nameKey: 'benefits' },
  { id: 'features', nameKey: 'features' },
  { id: 'usecases', nameKey: 'useCases' },
  { id: 'contact', nameKey: 'contact' },
];

// Load logo for overlays
const loadLogo = (): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = '/lovable-uploads/4ffa2fa8-716e-4f32-abc0-0c1b5f099cac.png';
  });
};

export function BrochureGeneratorModal({ open, onClose }: BrochureGeneratorModalProps) {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [pages, setPages] = useState<BrochurePage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(-1);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const abortRef = useRef(false);

  // Initialize pages when modal opens
  useEffect(() => {
    if (open) {
      setPages(BROCHURE_PAGES.map(p => ({
        id: p.id,
        name: t(`business.brochure.pages.${p.nameKey}`) || p.nameKey,
        status: 'pending' as PageStatus,
      })));
      setCurrentPageIndex(-1);
      setIsGenerating(false);
      abortRef.current = false;
      
      // Preload logo
      loadLogo().then(setLogo).catch(console.error);
    }
  }, [open, t]);

  const completedCount = pages.filter(p => p.status === 'complete').length;
  const progress = (completedCount / pages.length) * 100;
  const allComplete = completedCount === pages.length;

  const generatePage = async (pageId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-brochure-page', {
        body: { pageId, language }
      });

      if (error) {
        console.error(`Error generating ${pageId}:`, error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.imageUrl || null;
    } catch (err: any) {
      console.error(`Failed to generate ${pageId}:`, err);
      
      if (err?.message?.includes('Rate limit') || err?.status === 429) {
        toast({
          title: t('business.brochure.rateLimited'),
          description: t('business.brochure.rateLimitedDesc'),
          variant: 'destructive',
        });
      } else if (err?.message?.includes('credit') || err?.status === 402) {
        toast({
          title: t('business.brochure.creditsExhausted'),
          description: t('business.brochure.creditsExhaustedDesc'),
          variant: 'destructive',
        });
      }
      
      return null;
    }
  };

  const applyOverlay = async (imageUrl: string, pageId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Create canvas at A4 ratio (1:1.414)
        const canvas = document.createElement('canvas');
        const width = 1200;
        const height = Math.round(width * 1.414);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Draw base image scaled to fill
        const scale = Math.max(width / img.width, height / img.height);
        const x = (width - img.width * scale) / 2;
        const y = (height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Apply page-specific overlay
        applyPageOverlay(ctx, pageId, width, height, logo);

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const applyPageOverlay = (
    ctx: CanvasRenderingContext2D,
    pageId: string,
    width: number,
    height: number,
    logo: HTMLImageElement | null
  ) => {
    // Common text shadow for readability on colorful backgrounds
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    switch (pageId) {
      case 'cover':
        // Semi-transparent overlay at top for logo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
        roundRect(ctx, 40, 40, width - 80, 160, 20);
        ctx.fill();
        
        // Logo at top
        if (logo) {
          const logoWidth = 200;
          const logoHeight = (logo.height / logo.width) * logoWidth;
          ctx.shadowColor = 'transparent';
          ctx.drawImage(logo, (width - logoWidth) / 2, 55, logoWidth, logoHeight);
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        }
        
        // Subtitle under logo
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#6B7280';
        ctx.font = '18px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Global eSIM Solutions Provider', width / 2, 175);
        
        // Main content card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, 40, height - 520, width - 80, 480, 24);
        ctx.fill();
        
        // Title
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 56px Inter, system-ui, sans-serif';
        ctx.fillText('ENTERPRISE', width / 2, height - 440);
        ctx.fillStyle = '#F97316';
        ctx.font = 'bold 56px Inter, system-ui, sans-serif';
        ctx.fillText('eSIM SOLUTIONS', width / 2, height - 380);
        
        // Description
        ctx.font = '22px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#4B5563';
        ctx.fillText('Empower your global workforce with instant,', width / 2, height - 320);
        ctx.fillText('reliable mobile connectivity anywhere in the world.', width / 2, height - 290);
        
        // Key value props
        ctx.font = '18px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#6B7280';
        ctx.fillText('✓ Instant activation via QR code  •  ✓ No physical SIM needed  •  ✓ 24/7 enterprise support', width / 2, height - 245);
        
        // Divider line
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80, height - 220);
        ctx.lineTo(width - 80, height - 220);
        ctx.stroke();
        
        // Stats section
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 18px Inter, system-ui, sans-serif';
        ctx.fillText('TRUSTED BY LEADING ENTERPRISES WORLDWIDE', width / 2, height - 190);
        
        const stats = [
          { value: '151+', label: 'Countries', sublabel: 'Covered' },
          { value: '200+', label: 'Carrier', sublabel: 'Partners' },
          { value: '4,500+', label: 'Enterprise', sublabel: 'Clients' },
          { value: '99.9%', label: 'Uptime', sublabel: 'Guaranteed' },
        ];
        const boxWidth = 150;
        const startX = (width - (boxWidth * 4 + 25 * 3)) / 2;
        stats.forEach((stat, i) => {
          const bx = startX + i * (boxWidth + 25);
          // Colorful gradient-like boxes
          const colors = ['#FF6B00', '#00E5FF', '#FF1493', '#7C3AED'];
          ctx.fillStyle = colors[i];
          roundRect(ctx, bx, height - 160, boxWidth, 85, 12);
          ctx.fill();
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 32px Inter, system-ui, sans-serif';
          ctx.fillText(stat.value, bx + boxWidth / 2, height - 110);
          ctx.font = '14px Inter, system-ui, sans-serif';
          ctx.fillText(stat.label, bx + boxWidth / 2, height - 88);
          ctx.font = '12px Inter, system-ui, sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillText(stat.sublabel, bx + boxWidth / 2, height - 73);
        });
        
        // Footer
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '14px Inter, system-ui, sans-serif';
        ctx.fillText('mobile11.com/business | business@mobile11.com', width / 2, height - 25);
        break;

      case 'benefits':
        // Header card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, 40, 30, width - 80, 150, 20);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#F97316';
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WHY MOBILE11', width / 2, 65);
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 42px Inter, system-ui, sans-serif';
        ctx.fillText('The Smart Choice for', width / 2, 110);
        ctx.fillText('Enterprise Connectivity', width / 2, 155);
        
        // Benefits cards at bottom
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, 40, height - 450, width - 80, 410, 20);
        ctx.fill();
        
        // Section subtitle
        ctx.fillStyle = '#6B7280';
        ctx.font = '18px Inter, system-ui, sans-serif';
        ctx.fillText('Enterprise-grade eSIM solutions designed for modern business needs', width / 2, height - 420);
        
        const benefits = [
          { 
            icon: '🌐', 
            title: 'Global Coverage', 
            desc: '150+ countries with reliable networks',
            detail: 'Access premium carriers worldwide'
          },
          { 
            icon: '⚡', 
            title: 'Instant Activation', 
            desc: 'QR code delivery in seconds',
            detail: 'No physical SIM shipping delays'
          },
          { 
            icon: '🛡️', 
            title: 'Enterprise Security', 
            desc: 'Encrypted connections & compliance',
            detail: 'SOC2 & GDPR compliant'
          },
          { 
            icon: '💰', 
            title: 'Cost Optimization', 
            desc: 'Save up to 70% on roaming',
            detail: 'Predictable monthly billing'
          },
          { 
            icon: '📊', 
            title: 'Usage Analytics', 
            desc: 'Real-time team monitoring',
            detail: 'Detailed usage reports'
          },
          { 
            icon: '🎧', 
            title: '24/7 Support', 
            desc: 'Dedicated account manager',
            detail: 'Priority enterprise support'
          },
        ];
        
        benefits.forEach((b, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const cardWidth = (width - 160) / 3;
          const bx = 60 + col * (cardWidth + 20);
          const by = height - 390 + row * 170;
          
          // Benefit card background
          ctx.fillStyle = 'rgba(249, 115, 22, 0.08)';
          roundRect(ctx, bx, by, cardWidth, 150, 12);
          ctx.fill();
          
          // Border
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
          ctx.lineWidth = 1;
          roundRect(ctx, bx, by, cardWidth, 150, 12);
          ctx.stroke();
          
          ctx.font = '36px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b.icon, bx + cardWidth / 2, by + 40);
          
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 18px Inter, system-ui, sans-serif';
          ctx.fillText(b.title, bx + cardWidth / 2, by + 70);
          
          ctx.fillStyle = '#4B5563';
          ctx.font = '14px Inter, system-ui, sans-serif';
          ctx.fillText(b.desc, bx + cardWidth / 2, by + 95);
          
          ctx.fillStyle = '#9CA3AF';
          ctx.font = '12px Inter, system-ui, sans-serif';
          ctx.fillText(b.detail, bx + cardWidth / 2, by + 115);
        });
        
        // Logo at bottom
        if (logo) {
          const logoWidth = 80;
          const logoHeight = (logo.height / logo.width) * logoWidth;
          ctx.drawImage(logo, width - 120, height - 50, logoWidth, logoHeight);
        }
        break;

      case 'features':
        // Header card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, 40, 30, width - 80, 150, 20);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#F97316';
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PLATFORM FEATURES', width / 2, 65);
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 42px Inter, system-ui, sans-serif';
        ctx.fillText('Powerful Enterprise', width / 2, 110);
        ctx.fillText('Management Tools', width / 2, 155);
        
        // Features content card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, 40, height - 480, width - 80, 440, 20);
        ctx.fill();
        
        // Two column layout
        const leftFeatures = [
          { icon: '📱', title: 'Team Dashboard', desc: 'Centralized control panel for all eSIMs' },
          { icon: '📈', title: 'Real-time Analytics', desc: 'Monitor usage, costs, and performance' },
          { icon: '🔄', title: 'Auto Top-up', desc: 'Never run out of data with smart refills' },
          { icon: '👥', title: 'Role Management', desc: 'Admin, manager, and user access levels' },
        ];
        
        const rightFeatures = [
          { icon: '📋', title: 'Bulk Ordering', desc: 'Deploy hundreds of eSIMs instantly' },
          { icon: '🔔', title: 'Smart Alerts', desc: 'Usage notifications and expiry warnings' },
          { icon: '💳', title: 'Flexible Billing', desc: 'Monthly invoicing or pay-as-you-go' },
          { icon: '🔗', title: 'API Integration', desc: 'Connect with your existing systems' },
        ];
        
        ctx.textAlign = 'left';
        leftFeatures.forEach((f, i) => {
          const fy = height - 445 + i * 85;
          ctx.font = '28px Inter, system-ui, sans-serif';
          ctx.fillText(f.icon, 80, fy + 25);
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 18px Inter, system-ui, sans-serif';
          ctx.fillText(f.title, 125, fy + 20);
          ctx.fillStyle = '#6B7280';
          ctx.font = '15px Inter, system-ui, sans-serif';
          ctx.fillText(f.desc, 125, fy + 45);
          ctx.fillStyle = '#1F2937';
        });
        
        rightFeatures.forEach((f, i) => {
          const fy = height - 445 + i * 85;
          ctx.font = '28px Inter, system-ui, sans-serif';
          ctx.fillText(f.icon, width / 2 + 40, fy + 25);
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 18px Inter, system-ui, sans-serif';
          ctx.fillText(f.title, width / 2 + 85, fy + 20);
          ctx.fillStyle = '#6B7280';
          ctx.font = '15px Inter, system-ui, sans-serif';
          ctx.fillText(f.desc, width / 2 + 85, fy + 45);
          ctx.fillStyle = '#1F2937';
        });
        
        // Divider
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80, height - 110);
        ctx.lineTo(width - 80, height - 110);
        ctx.stroke();
        
        // Plan options at bottom
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 18px Inter, system-ui, sans-serif';
        ctx.fillText('AVAILABLE PLAN TYPES', width / 2, height - 80);
        
        const plans = [
          { name: 'Limitless', desc: 'Unlimited data', color: '#FF6B00' },
          { name: 'Max Speed', desc: 'Premium speed', color: '#00E5FF' },
          { name: 'Day Pass', desc: 'Pay per day', color: '#FF1493' },
        ];
        const planWidth = 180;
        const planStartX = (width - (planWidth * 3 + 20 * 2)) / 2;
        plans.forEach((plan, i) => {
          const px = planStartX + i * (planWidth + 20);
          ctx.fillStyle = plan.color;
          roundRect(ctx, px, height - 60, planWidth, 45, 10);
          ctx.fill();
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px Inter, system-ui, sans-serif';
          ctx.fillText(plan.name, px + planWidth / 2, height - 40);
        });
        break;

      case 'usecases':
        // Header card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, 40, 30, width - 80, 150, 20);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#F97316';
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('USE CASES', width / 2, 65);
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 42px Inter, system-ui, sans-serif';
        ctx.fillText('Solutions for Every', width / 2, 110);
        ctx.fillText('Business Need', width / 2, 155);
        
        // Use cases content card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, 40, height - 520, width - 80, 480, 20);
        ctx.fill();
        
        const useCases = [
          { 
            icon: '✈️', 
            title: 'Business Travel', 
            desc: 'Keep executives connected during international trips',
            stats: 'Avg. savings: $150/trip'
          },
          { 
            icon: '🏠', 
            title: 'Remote Teams', 
            desc: 'Enable global workforce with reliable connectivity',
            stats: '100% coverage guaranteed'
          },
          { 
            icon: '📹', 
            title: 'Media & Production', 
            desc: 'Reliable upload speeds for field crews',
            stats: 'HD streaming capable'
          },
          { 
            icon: '🏢', 
            title: 'Sales Teams', 
            desc: 'Always-on connectivity for client meetings',
            stats: 'Instant activation'
          },
          { 
            icon: '🚚', 
            title: 'Logistics', 
            desc: 'Track and manage fleet communications',
            stats: 'IoT-ready solutions'
          },
          { 
            icon: '🏥', 
            title: 'Healthcare', 
            desc: 'HIPAA-compliant connectivity for remote care',
            stats: 'Secure data transfer'
          },
        ];
        
        useCases.forEach((uc, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cardWidth = (width - 140) / 2;
          const ux = 60 + col * (cardWidth + 20);
          const uy = height - 490 + row * 130;
          
          // Use case card
          ctx.fillStyle = 'rgba(249, 115, 22, 0.06)';
          roundRect(ctx, ux, uy, cardWidth, 115, 12);
          ctx.fill();
          
          ctx.font = '32px Inter, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(uc.icon, ux + 15, uy + 40);
          
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 20px Inter, system-ui, sans-serif';
          ctx.fillText(uc.title, ux + 60, uy + 35);
          
          ctx.fillStyle = '#6B7280';
          ctx.font = '14px Inter, system-ui, sans-serif';
          ctx.fillText(uc.desc, ux + 60, uy + 60);
          
          ctx.fillStyle = '#F97316';
          ctx.font = 'bold 13px Inter, system-ui, sans-serif';
          ctx.fillText(uc.stats, ux + 60, uy + 85);
        });
        
        // Testimonial quote at bottom
        ctx.fillStyle = 'rgba(249, 115, 22, 0.95)';
        roundRect(ctx, 60, height - 95, width - 120, 75, 12);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('"Mobile11 cut our telecom costs by 65% while improving reliability."', width / 2, height - 58);
        ctx.font = 'italic 14px Inter, system-ui, sans-serif';
        ctx.fillText('— IT Director, Fortune 500 Company', width / 2, height - 35);
        break;

      case 'contact':
        // Top header card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, 40, 40, width - 80, 220, 24);
        ctx.fill();
        
        // Logo at top
        if (logo) {
          const logoWidth = 180;
          const logoHeight = (logo.height / logo.width) * logoWidth;
          ctx.shadowColor = 'transparent';
          ctx.drawImage(logo, (width - logoWidth) / 2, 55, logoWidth, logoHeight);
        }
        
        // CTA Header
        ctx.fillStyle = '#F97316';
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GET STARTED', width / 2, 175);
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 38px Inter, system-ui, sans-serif';
        ctx.fillText('Ready to Transform Your', width / 2, 215);
        ctx.fillText('Enterprise Connectivity?', width / 2, 255);
        
        // Main contact card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
        roundRect(ctx, 60, height - 480, width - 120, 440, 24);
        ctx.fill();
        
        // Benefits reminder
        ctx.fillStyle = '#6B7280';
        ctx.font = '18px Inter, system-ui, sans-serif';
        ctx.fillText('Join 4,500+ enterprises already connected with Mobile11', width / 2, height - 445);
        
        // Contact options grid
        const contactOptions = [
          { icon: '📧', label: 'Email Us', value: 'business@mobile11.com', desc: 'Get a response within 24h' },
          { icon: '📞', label: 'Call Us', value: '+66 2 6903626', desc: 'Mon-Fri 9AM-6PM (GMT+7)' },
          { icon: '🌐', label: 'Visit Website', value: 'mobile11.com/business', desc: 'Learn more & request demo' },
          { icon: '💬', label: 'Live Chat', value: 'Available 24/7', desc: 'Instant support on our website' },
        ];
        
        contactOptions.forEach((opt, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cardWidth = (width - 180) / 2;
          const ox = 80 + col * (cardWidth + 20);
          const oy = height - 410 + row * 120;
          
          ctx.fillStyle = 'rgba(249, 115, 22, 0.08)';
          roundRect(ctx, ox, oy, cardWidth, 100, 12);
          ctx.fill();
          
          ctx.font = '28px Inter, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(opt.icon, ox + 15, oy + 40);
          
          ctx.fillStyle = '#9CA3AF';
          ctx.font = '12px Inter, system-ui, sans-serif';
          ctx.fillText(opt.label, ox + 55, oy + 25);
          
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 18px Inter, system-ui, sans-serif';
          ctx.fillText(opt.value, ox + 55, oy + 50);
          
          ctx.fillStyle = '#6B7280';
          ctx.font = '13px Inter, system-ui, sans-serif';
          ctx.fillText(opt.desc, ox + 55, oy + 75);
        });
        
        // Divider
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(100, height - 155);
        ctx.lineTo(width - 100, height - 155);
        ctx.stroke();
        
        // Special offer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 20px Inter, system-ui, sans-serif';
        ctx.fillText('🎁 Special Enterprise Offer', width / 2, height - 120);
        ctx.fillStyle = '#6B7280';
        ctx.font = '16px Inter, system-ui, sans-serif';
        ctx.fillText('Get 20% off your first 3 months when you sign up this quarter', width / 2, height - 95);
        
        // CTA Button
        ctx.fillStyle = '#F97316';
        roundRect(ctx, width / 2 - 160, height - 70, 320, 55, 28);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Inter, system-ui, sans-serif';
        ctx.fillText('Request a Free Demo →', width / 2, height - 35);
        break;
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    abortRef.current = false;

    for (let i = 0; i < pages.length; i++) {
      if (abortRef.current) break;

      setCurrentPageIndex(i);
      setPages(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'generating' } : p
      ));

      const imageUrl = await generatePage(pages[i].id);
      
      if (imageUrl) {
        // Apply overlay to the generated image
        const finalImageUrl = await applyOverlay(imageUrl, pages[i].id);
        
        setPages(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'complete', imageUrl, finalImageUrl } : p
        ));
      } else {
        setPages(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'error' } : p
        ));
      }

      // Delay between requests to avoid rate limiting
      if (i < pages.length - 1 && !abortRef.current) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsGenerating(false);
    setCurrentPageIndex(-1);
  };

  const downloadPdf = async () => {
    const completedPages = pages.filter(p => p.finalImageUrl);
    if (completedPages.length === 0) return;

    toast({
      title: t('business.brochure.generatingPdf'),
      description: t('business.brochure.pleaseWait'),
    });

    try {
      // A4 dimensions in mm
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;

      for (let i = 0; i < completedPages.length; i++) {
        if (i > 0) pdf.addPage();
        
        const page = completedPages[i];
        if (page.finalImageUrl) {
          pdf.addImage(page.finalImageUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
        }
      }

      pdf.save('Mobile11-Enterprise-Brochure.pdf');
      
      toast({
        title: t('business.brochure.downloadComplete'),
        description: t('business.brochure.brochureSaved'),
      });
      
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
    setIsGenerating(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="max-w-lg bg-[#FAF7F2]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <Image className="h-5 w-5 text-orange-500" />
            {t('business.brochure.generating')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Page list */}
          <div className="space-y-3">
            {pages.map((page, idx) => (
              <div
                key={page.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  page.status === 'generating'
                    ? 'bg-orange-50 border-orange-200'
                    : page.status === 'complete'
                    ? 'bg-green-50 border-green-200'
                    : page.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-gray-900">{page.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  {page.status === 'pending' && (
                    <span className="text-sm text-gray-400">{t('business.brochure.pending')}</span>
                  )}
                  {page.status === 'generating' && (
                    <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
                  )}
                  {page.status === 'complete' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {page.status === 'error' && (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t('business.brochure.progress')}: {completedCount}/{pages.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Thumbnail preview */}
          {pages.some(p => p.finalImageUrl) && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {pages.filter(p => p.finalImageUrl).map(page => (
                <img
                  key={page.id}
                  src={page.finalImageUrl}
                  alt={page.name}
                  className="h-20 w-auto rounded-lg border border-gray-200 shadow-sm"
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            {t('business.brochure.cancel')}
          </Button>

          {!isGenerating && !allComplete && (
            <Button
              onClick={startGeneration}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {t('business.brochure.startGeneration')}
            </Button>
          )}

          {allComplete && (
            <Button
              onClick={downloadPdf}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <FileDown className="mr-2 h-4 w-4" />
              {t('business.brochure.downloadPdf')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
