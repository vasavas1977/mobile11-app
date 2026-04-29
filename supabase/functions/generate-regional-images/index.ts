import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const regionPrompts = {
  europe: `Vibrant sunset cityscape, 16:9 wide landscape. Brilliant orange-red sunset sky gradient. CRITICAL COMPOSITION: Place the Eiffel Tower prominently in the UPPER CENTER of the image, rising tall into the sky occupying the TOP HALF. Big Ben and cathedral spires also positioned in the UPPER HALF of the frame. The BOTTOM THIRD should be simple dark maroon/burgundy city silhouette with minimal details - this area will have text overlay. Decorative white clouds in upper sky. Flat vector Lottie animation style. EXTREMELY VIBRANT saturated colors - intense oranges, fiery reds, golden yellows. NO empty space, NO white areas. Ultra high resolution.`,
  
  asia: `Vibrant pink-magenta Asian landscape, 16:9 wide format. CRITICAL COMPOSITION: Mount Fuji with cherry blossom pink snow must be positioned in the UPPER CENTER of the image, dominating the TOP HALF of the frame. Japanese pagoda and cherry blossom branches also in UPPER HALF. Sky is solid gradient from intense magenta-pink at top through hot pink to coral. The BOTTOM THIRD should be simple dark purple city silhouette with minimal details - this area will have text overlay. Flat vector Lottie animation style. EXTREMELY VIBRANT saturated colors - hot pinks, magentas, coral, deep purples. Ultra high resolution.`,
  
  global: `Wide landscape world travel illustration, 16:9 format, Lottie animation flat design style. CRITICAL COMPOSITION: Position the stylized teal globe with landmarks in the UPPER CENTER of the image, occupying the TOP HALF. Landmarks on globe: Statue of Liberty, Eiffel Tower, Sydney Opera House, Taj Mahal, Big Ben. Small white airplane silhouettes flying around globe in upper portion. The BOTTOM THIRD should be simple gradient fade with minimal details - this area will have text overlay. VIBRANT saturated colors - bright teals, coral, oranges, blues, greens. Gradient background from warm orange to teal. Ultra high resolution.`
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { region, forceRegenerate = false } = await req.json();
    
    if (!region || !regionPrompts[region as keyof typeof regionPrompts]) {
      return new Response(
        JSON.stringify({ error: 'Invalid region. Must be: europe, asia, or global' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `${region}-lottie.webp`;

    // Check if image already exists (unless force regenerate)
    if (!forceRegenerate) {
      const { data: existingFile } = await supabase.storage
        .from('regional-images')
        .list('', { search: fileName });

      if (existingFile && existingFile.length > 0) {
        const { data: urlData } = supabase.storage
          .from('regional-images')
          .getPublicUrl(fileName);

        console.log(`Image already exists for ${region}, returning cached URL`);
        return new Response(
          JSON.stringify({ 
            imageUrl: urlData.publicUrl,
            cached: true,
            region 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Generating new image for region: ${region}`);
    const prompt = regionPrompts[region as keyof typeof regionPrompts];

    // Call Lovable AI Gateway to generate image
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response received for', region);

    // Extract base64 image from response
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image data in response:', JSON.stringify(aiData).substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert base64 to blob for upload
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('regional-images')
      .upload(fileName, binaryData, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to save image', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('regional-images')
      .getPublicUrl(fileName);

    console.log(`Successfully generated and uploaded image for ${region}`);

    return new Response(
      JSON.stringify({ 
        imageUrl: urlData.publicUrl,
        cached: false,
        region 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-regional-images:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
