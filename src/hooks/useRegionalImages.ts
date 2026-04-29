import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Fallback static images
import europeImageFallback from '@/assets/regions/europe-regional.png';
import asiaImageFallback from '@/assets/regions/asia-regional.png';
import globalImageFallback from '@/assets/regions/global-regional.png';

interface RegionalImages {
  europe: string;
  asia: string;
  global: string;
}

const fallbackImages: RegionalImages = {
  europe: europeImageFallback,
  asia: asiaImageFallback,
  global: globalImageFallback,
};

export function useRegionalImages() {
  const [images, setImages] = useState<RegionalImages>(fallbackImages);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImages() {
      try {
        const regions: (keyof RegionalImages)[] = ['europe', 'asia', 'global'];
        const newImages: RegionalImages = { ...fallbackImages };

        for (const region of regions) {
          const fileName = `${region}-lottie.webp`;
          
          // Check if AI-generated image exists in storage
          const { data: files } = await supabase.storage
            .from('regional-images')
            .list('', { search: fileName });

          if (files && files.length > 0) {
            const { data: urlData } = supabase.storage
              .from('regional-images')
              .getPublicUrl(fileName);

            if (urlData?.publicUrl) {
              // Add cache-busting timestamp
              newImages[region] = `${urlData.publicUrl}?t=${Date.now()}`;
            }
          }
        }

        setImages(newImages);
      } catch (err) {
        console.error('Error fetching regional images:', err);
        setError(err instanceof Error ? err.message : 'Failed to load images');
        // Keep fallback images on error
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, []);

  const regenerateImage = async (region: keyof RegionalImages) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-regional-images', {
        body: { region, forceRegenerate: true }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setImages(prev => ({
          ...prev,
          [region]: `${data.imageUrl}?t=${Date.now()}`
        }));
        return data.imageUrl;
      }
    } catch (err) {
      console.error(`Error regenerating ${region} image:`, err);
      throw err;
    }
  };

  const regenerateAll = async () => {
    const regions: (keyof RegionalImages)[] = ['europe', 'asia', 'global'];
    
    for (const region of regions) {
      await regenerateImage(region);
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  return {
    images,
    loading,
    error,
    regenerateImage,
    regenerateAll,
    fallbackImages
  };
}
