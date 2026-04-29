import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Europe 42 country images - only importing files that actually exist
import albania from "@/assets/blog/europe42/albania.jpg";
import andorra from "@/assets/blog/europe42/andorra.jpg";
import austria from "@/assets/blog/europe42/austria.jpg";
import belgium from "@/assets/blog/europe42/belgium.jpg";
import bosnia from "@/assets/blog/europe42/bosnia.jpg";
import bulgaria from "@/assets/blog/europe42/bulgaria.jpg";
import croatia from "@/assets/blog/europe42/croatia.jpg";
import cyprus from "@/assets/blog/europe42/cyprus.jpg";
import czechia from "@/assets/blog/europe42/czechia.jpg";
import denmark from "@/assets/blog/europe42/denmark.jpg";
import estonia from "@/assets/blog/europe42/estonia.jpg";
import finland from "@/assets/blog/europe42/finland.jpg";
import gibraltar from "@/assets/blog/europe42/gibraltar.jpg";
import greece from "@/assets/blog/europe42/greece.jpg";
import guernsey from "@/assets/blog/europe42/guernsey.jpg";
import hungary from "@/assets/blog/europe42/hungary.jpg";
import iceland from "@/assets/blog/europe42/iceland.jpg";
import ireland from "@/assets/blog/europe42/ireland.jpg";
import isleofman from "@/assets/blog/europe42/isleofman.jpg";
import jersey from "@/assets/blog/europe42/jersey.jpg";
import latvia from "@/assets/blog/europe42/latvia.jpg";
import liechtenstein from "@/assets/blog/europe42/liechtenstein.jpg";
import lithuania from "@/assets/blog/europe42/lithuania.jpg";
import luxembourg from "@/assets/blog/europe42/luxembourg.jpg";
import malta from "@/assets/blog/europe42/malta.jpg";
import monaco from "@/assets/blog/europe42/monaco.jpg";
import montenegro from "@/assets/blog/europe42/montenegro.jpg";
import northmacedonia from "@/assets/blog/europe42/northmacedonia.jpg";
import norway from "@/assets/blog/europe42/norway.jpg";
import poland from "@/assets/blog/europe42/poland.jpg";
import portugal from "@/assets/blog/europe42/portugal.jpg";
import romania from "@/assets/blog/europe42/romania.jpg";
import sanmarino from "@/assets/blog/europe42/sanmarino.jpg";
import serbia from "@/assets/blog/europe42/serbia.jpg";
import slovakia from "@/assets/blog/europe42/slovakia.jpg";
import slovenia from "@/assets/blog/europe42/slovenia.jpg";
import sweden from "@/assets/blog/europe42/sweden.jpg";
import turkey from "@/assets/blog/europe42/turkey.jpg";
import ukraine from "@/assets/blog/europe42/ukraine.jpg";
import vatican from "@/assets/blog/europe42/vatican.jpg";

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
  { id: 'albania', name: 'Albania', localPath: albania, storagePath: 'blog/europe42/albania.jpg', contentType: 'image/jpeg' },
  { id: 'andorra', name: 'Andorra', localPath: andorra, storagePath: 'blog/europe42/andorra.jpg', contentType: 'image/jpeg' },
  { id: 'austria', name: 'Austria', localPath: austria, storagePath: 'blog/europe42/austria.jpg', contentType: 'image/jpeg' },
  { id: 'belgium', name: 'Belgium', localPath: belgium, storagePath: 'blog/europe42/belgium.jpg', contentType: 'image/jpeg' },
  { id: 'bosnia', name: 'Bosnia', localPath: bosnia, storagePath: 'blog/europe42/bosnia.jpg', contentType: 'image/jpeg' },
  { id: 'bulgaria', name: 'Bulgaria', localPath: bulgaria, storagePath: 'blog/europe42/bulgaria.jpg', contentType: 'image/jpeg' },
  { id: 'croatia', name: 'Croatia', localPath: croatia, storagePath: 'blog/europe42/croatia.jpg', contentType: 'image/jpeg' },
  { id: 'cyprus', name: 'Cyprus', localPath: cyprus, storagePath: 'blog/europe42/cyprus.jpg', contentType: 'image/jpeg' },
  { id: 'czechia', name: 'Czechia', localPath: czechia, storagePath: 'blog/europe42/czechia.jpg', contentType: 'image/jpeg' },
  { id: 'denmark', name: 'Denmark', localPath: denmark, storagePath: 'blog/europe42/denmark.jpg', contentType: 'image/jpeg' },
  { id: 'estonia', name: 'Estonia', localPath: estonia, storagePath: 'blog/europe42/estonia.jpg', contentType: 'image/jpeg' },
  { id: 'finland', name: 'Finland', localPath: finland, storagePath: 'blog/europe42/finland.jpg', contentType: 'image/jpeg' },
  { id: 'gibraltar', name: 'Gibraltar', localPath: gibraltar, storagePath: 'blog/europe42/gibraltar.jpg', contentType: 'image/jpeg' },
  { id: 'greece', name: 'Greece', localPath: greece, storagePath: 'blog/europe42/greece.jpg', contentType: 'image/jpeg' },
  { id: 'guernsey', name: 'Guernsey', localPath: guernsey, storagePath: 'blog/europe42/guernsey.jpg', contentType: 'image/jpeg' },
  { id: 'hungary', name: 'Hungary', localPath: hungary, storagePath: 'blog/europe42/hungary.jpg', contentType: 'image/jpeg' },
  { id: 'iceland', name: 'Iceland', localPath: iceland, storagePath: 'blog/europe42/iceland.jpg', contentType: 'image/jpeg' },
  { id: 'ireland', name: 'Ireland', localPath: ireland, storagePath: 'blog/europe42/ireland.jpg', contentType: 'image/jpeg' },
  { id: 'isleofman', name: 'Isle of Man', localPath: isleofman, storagePath: 'blog/europe42/isleofman.jpg', contentType: 'image/jpeg' },
  { id: 'jersey', name: 'Jersey', localPath: jersey, storagePath: 'blog/europe42/jersey.jpg', contentType: 'image/jpeg' },
  { id: 'latvia', name: 'Latvia', localPath: latvia, storagePath: 'blog/europe42/latvia.jpg', contentType: 'image/jpeg' },
  { id: 'liechtenstein', name: 'Liechtenstein', localPath: liechtenstein, storagePath: 'blog/europe42/liechtenstein.jpg', contentType: 'image/jpeg' },
  { id: 'lithuania', name: 'Lithuania', localPath: lithuania, storagePath: 'blog/europe42/lithuania.jpg', contentType: 'image/jpeg' },
  { id: 'luxembourg', name: 'Luxembourg', localPath: luxembourg, storagePath: 'blog/europe42/luxembourg.jpg', contentType: 'image/jpeg' },
  { id: 'malta', name: 'Malta', localPath: malta, storagePath: 'blog/europe42/malta.jpg', contentType: 'image/jpeg' },
  { id: 'monaco', name: 'Monaco', localPath: monaco, storagePath: 'blog/europe42/monaco.jpg', contentType: 'image/jpeg' },
  { id: 'montenegro', name: 'Montenegro', localPath: montenegro, storagePath: 'blog/europe42/montenegro.jpg', contentType: 'image/jpeg' },
  { id: 'northmacedonia', name: 'North Macedonia', localPath: northmacedonia, storagePath: 'blog/europe42/northmacedonia.jpg', contentType: 'image/jpeg' },
  { id: 'norway', name: 'Norway', localPath: norway, storagePath: 'blog/europe42/norway.jpg', contentType: 'image/jpeg' },
  { id: 'poland', name: 'Poland', localPath: poland, storagePath: 'blog/europe42/poland.jpg', contentType: 'image/jpeg' },
  { id: 'portugal', name: 'Portugal', localPath: portugal, storagePath: 'blog/europe42/portugal.jpg', contentType: 'image/jpeg' },
  { id: 'romania', name: 'Romania', localPath: romania, storagePath: 'blog/europe42/romania.jpg', contentType: 'image/jpeg' },
  { id: 'sanmarino', name: 'San Marino', localPath: sanmarino, storagePath: 'blog/europe42/sanmarino.jpg', contentType: 'image/jpeg' },
  { id: 'serbia', name: 'Serbia', localPath: serbia, storagePath: 'blog/europe42/serbia.jpg', contentType: 'image/jpeg' },
  { id: 'slovakia', name: 'Slovakia', localPath: slovakia, storagePath: 'blog/europe42/slovakia.jpg', contentType: 'image/jpeg' },
  { id: 'slovenia', name: 'Slovenia', localPath: slovenia, storagePath: 'blog/europe42/slovenia.jpg', contentType: 'image/jpeg' },
  { id: 'sweden', name: 'Sweden', localPath: sweden, storagePath: 'blog/europe42/sweden.jpg', contentType: 'image/jpeg' },
  { id: 'turkey', name: 'Turkey', localPath: turkey, storagePath: 'blog/europe42/turkey.jpg', contentType: 'image/jpeg' },
  { id: 'ukraine', name: 'Ukraine', localPath: ukraine, storagePath: 'blog/europe42/ukraine.jpg', contentType: 'image/jpeg' },
  { id: 'vatican', name: 'Vatican', localPath: vatican, storagePath: 'blog/europe42/vatican.jpg', contentType: 'image/jpeg' },
];

export default function MigrateEurope42Page() {
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
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    setIsMigrating(false);
    toast({
      title: "Migration Complete",
      description: `Processed ${assetsToMigrate.length} Europe 42 images.`,
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
        <h1 className="text-3xl font-bold">Migrate Europe 42 Images</h1>
        <p className="text-muted-foreground mt-2">
          Upload {assetsToMigrate.length} European country images to Supabase Storage
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

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
        {assetsToMigrate.map((asset) => {
          const status = migrationStatus[asset.id];
          return (
            <Card key={asset.id} className="overflow-hidden">
              <div className="aspect-square bg-muted relative">
                <img 
                  src={asset.localPath} 
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-1 right-1">
                  {getStatusIcon(status)}
                </div>
              </div>
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate">{asset.name}</span>
                  {status?.status === 'success' ? (
                    <Badge variant="outline" className="text-green-600 text-xs px-1">✓</Badge>
                  ) : status?.status === 'error' ? (
                    <Badge variant="destructive" className="text-xs px-1">✗</Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
