import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Destination images (matching actual files in src/assets/destinations/)
import japanDestination from "@/assets/destinations/japan.png";
import koreaDestination from "@/assets/destinations/korea.png";
import thailandDestination from "@/assets/destinations/thailand.png";
import usaDestination from "@/assets/destinations/usa.png";
import europeDestination from "@/assets/destinations/europe.png";
import australiaDestination from "@/assets/destinations/australia.png";
import taiwanDestination from "@/assets/destinations/taiwan.png";
import vietnamDestination from "@/assets/destinations/vietnam.png";
import singaporeDestination from "@/assets/destinations/singapore.png";
import malaysiaDestination from "@/assets/destinations/malaysia.png";
import chinaDestination from "@/assets/destinations/china.png";
import hongkongMacauDestination from "@/assets/destinations/hongkong-macau.png";
import hqBuilding from "@/assets/1toall-hq.png";

interface AssetItem {
  id: string;
  name: string;
  localPath: string;
  storagePath: string;
  contentType: string;
}

interface MigrationStatus {
  status: 'pending' | 'uploading' | 'success' | 'error';
  publicUrl?: string;
  error?: string;
}

const assetsToMigrate: AssetItem[] = [
  { id: 'japan', name: 'Japan', localPath: japanDestination, storagePath: 'destinations/japan.png', contentType: 'image/png' },
  { id: 'korea', name: 'Korea', localPath: koreaDestination, storagePath: 'destinations/korea.png', contentType: 'image/png' },
  { id: 'thailand', name: 'Thailand', localPath: thailandDestination, storagePath: 'destinations/thailand.png', contentType: 'image/png' },
  { id: 'usa', name: 'USA', localPath: usaDestination, storagePath: 'destinations/usa.png', contentType: 'image/png' },
  { id: 'europe', name: 'Europe', localPath: europeDestination, storagePath: 'destinations/europe.png', contentType: 'image/png' },
  { id: 'australia', name: 'Australia', localPath: australiaDestination, storagePath: 'destinations/australia.png', contentType: 'image/png' },
  { id: 'taiwan', name: 'Taiwan', localPath: taiwanDestination, storagePath: 'destinations/taiwan.png', contentType: 'image/png' },
  { id: 'vietnam', name: 'Vietnam', localPath: vietnamDestination, storagePath: 'destinations/vietnam.png', contentType: 'image/png' },
  { id: 'singapore', name: 'Singapore', localPath: singaporeDestination, storagePath: 'destinations/singapore.png', contentType: 'image/png' },
  { id: 'malaysia', name: 'Malaysia', localPath: malaysiaDestination, storagePath: 'destinations/malaysia.png', contentType: 'image/png' },
  { id: 'china', name: 'China', localPath: chinaDestination, storagePath: 'destinations/china.png', contentType: 'image/png' },
  { id: 'hongkong-macau', name: 'Hong Kong & Macau', localPath: hongkongMacauDestination, storagePath: 'destinations/hongkong-macau.png', contentType: 'image/png' },
  { id: 'hq-building', name: 'HQ Building', localPath: hqBuilding, storagePath: 'about/1toall-hq.png', contentType: 'image/png' },
];

export default function MigrateDestinationsPage() {
  const [migrationStatus, setMigrationStatus] = useState<Record<string, MigrationStatus>>({});
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const migrateAsset = async (asset: AssetItem) => {
    setMigrationStatus(prev => ({
      ...prev,
      [asset.id]: { status: 'uploading' }
    }));

    try {
      const base64Data = await fetchImageAsBase64(asset.localPath);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('migrate-assets', {
        body: {
          imageData: base64Data,
          path: asset.storagePath,
          contentType: asset.contentType,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setMigrationStatus(prev => ({
        ...prev,
        [asset.id]: { status: 'success', publicUrl: response.data.publicUrl }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMigrationStatus(prev => ({
        ...prev,
        [asset.id]: { status: 'error', error: errorMessage }
      }));
    }
  };

  const migrateAll = async () => {
    setIsMigrating(true);
    for (const asset of assetsToMigrate) {
      if (migrationStatus[asset.id]?.status !== 'success') {
        await migrateAsset(asset);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    setIsMigrating(false);
    toast({
      title: "Migration Complete",
      description: `Processed ${assetsToMigrate.length} destination images.`,
    });
  };

  const completedCount = Object.values(migrationStatus).filter(s => s.status === 'success').length;
  const progress = (completedCount / assetsToMigrate.length) * 100;

  const getStatusIcon = (status?: MigrationStatus) => {
    if (!status) return null;
    switch (status.status) {
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/admin/migrate-assets" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Migration Hub
        </Link>
        <h1 className="text-3xl font-bold">Migrate Destinations</h1>
        <p className="text-muted-foreground mt-2">
          Upload {assetsToMigrate.length} destination images to Supabase Storage
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Progress: {completedCount} / {assetsToMigrate.length}</p>
              <Progress value={progress} className="w-64 mt-2" />
            </div>
            <Button onClick={migrateAll} disabled={isMigrating}>
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Migrate All
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {assetsToMigrate.map((asset) => {
          const status = migrationStatus[asset.id];
          return (
            <Card key={asset.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                <img 
                  src={asset.localPath} 
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  {getStatusIcon(status)}
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{asset.name}</span>
                  {status?.status === 'success' ? (
                    <Badge variant="outline" className="text-green-600">Done</Badge>
                  ) : status?.status === 'error' ? (
                    <Badge variant="destructive">Error</Badge>
                  ) : status?.status === 'uploading' ? (
                    <Badge variant="secondary">Uploading</Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => migrateAsset(asset)}
                      disabled={isMigrating}
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {status?.publicUrl && (
                  <a 
                    href={status.publicUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {status?.error && (
                  <p className="text-xs text-red-500 mt-1 truncate">{status.error}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
