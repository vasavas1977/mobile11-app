import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface LPAQRCodeProps {
  lpaString: string;
  size?: number;
  downloadFilename?: string;
}

export const LPAQRCode = ({ lpaString, size = 200, downloadFilename = 'esim-qr-code' }: LPAQRCodeProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Parse LPA string: LPA:1$SMDP_ADDRESS$ACTIVATION_CODE
  const parts = lpaString.split('$');
  const smdpAddress = parts[1] || 'Unknown';
  const activationCode = parts[2] || 'Unknown';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(lpaString);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "LPA string copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('tuge-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size + 40;
      canvas.height = size + 40;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${downloadFilename}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg border border-border shadow-sm">
      <div className="bg-white p-2 rounded">
        <QRCodeSVG
          id="tuge-qr-code"
          value={lpaString}
          size={size}
          level="H"
          includeMargin={false}
        />
      </div>

      <div className="w-full space-y-3">
        <div className="grid grid-cols-1 gap-2">
          <div className="p-2 bg-muted/50 rounded text-[10px] font-mono break-all border border-border">
            <span className="text-muted-foreground block mb-1 uppercase font-sans font-bold">SM-DP+ Address</span>
            {smdpAddress}
          </div>
          <div className="p-2 bg-muted/50 rounded text-[10px] font-mono break-all border border-border">
            <span className="text-muted-foreground block mb-1 uppercase font-sans font-bold">Activation Code</span>
            {activationCode}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-8 text-xs"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            Copy String
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-8 text-xs"
            onClick={downloadQRCode}
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
        
        <p className="text-[10px] text-center text-muted-foreground italic">
          Scan this QR code with your phone's camera or eSIM settings.
        </p>
      </div>
    </div>
  );
};
