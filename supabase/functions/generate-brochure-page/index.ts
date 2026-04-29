import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  pageId: string;
  language?: string;
}

// Vibrant colorful Lottie-style prompts for each brochure page
const pagePrompts: Record<string, string> = {
  cover: `Extremely vibrant and colorful flat vector Lottie animation style illustration. A diverse team of 3 stylized cartoon business characters (woman with glowing laptop, man with neon smartphone, person holding brilliant glowing eSIM chip with sparkles) standing on a colorful stylized globe with neon-lit connected cities, glowing dotted flight paths, and aurora-like color streams. SUPER SATURATED color palette: hot pink (#FF1493), electric orange (#FF6B00), neon cyan (#00E5FF), bright magenta (#FF00FF), vivid yellow (#FFEB00). Rainbow gradients on elements. Glowing effects and lens flares. White and cream (#FAF7F2) background with colorful geometric patterns, floating circles, and abstract shapes. Clean space at top for logo and bottom for text. No text in image. 16:9 aspect ratio. Ultra high resolution.`,
  
  benefits: `Extremely vibrant and colorful flat vector Lottie animation style illustration. Four large floating benefit icons in a 2x2 grid layout with NEON GLOW effects: (1) colorful globe with rainbow wireless signal waves pulsing outward, (2) bright shield with glowing golden checkmark and sparkles, (3) electric lightning bolt with neon circular timer rings, (4) group of connected people icons in gradient colors (pink, orange, cyan). Each icon inside a white card with colorful drop shadows and glowing borders. SUPER SATURATED palette: hot pink (#FF1493), electric orange (#FF6B00), neon cyan (#00E5FF), bright lime (#00FF88), vivid purple (#9B30FF). Rainbow gradients on decorative elements. Cream (#FAF7F2) background with colorful floating dots, circles, and geometric confetti. Space for text overlays. No text in image. 16:9 aspect ratio. Ultra high resolution.`,
  
  features: `Extremely vibrant and colorful flat vector Lottie animation style illustration. A stylized cartoon business professional interacting with a MASSIVE floating holographic dashboard bursting with colorful analytics: rainbow pie charts, neon line graphs in pink/cyan/orange, glowing progress bars, colorful team member avatars with glow effects. Multiple floating UI cards with gradient borders arranged around them. SUPER SATURATED colors: hot pink (#FF1493), electric orange (#FF6B00), neon cyan (#00E5FF), bright magenta (#FF00FF), vivid lime (#00FF88). Glowing particle effects and light rays. Cream (#FAF7F2) background with colorful grid pattern and floating geometric shapes. Modern tech product style. No text in image. 16:9 aspect ratio. Ultra high resolution.`,
  
  usecases: `Extremely vibrant and colorful flat vector Lottie animation style illustration. Four-panel collage in glowing rounded frames showing: (1) cheerful business traveler with colorful suitcase at vibrant airport gate with glowing phone, (2) happy remote worker at colorful modern cafe with rainbow laptop and steaming coffee, (3) energetic sales team on video call with neon world map and colorful avatars, (4) creative media crew with colorful camera equipment and rainbow broadcasting graphics. Characters are cartoon-style with bright expressions. SUPER SATURATED palette: hot pink (#FF1493), electric orange (#FF6B00), neon cyan (#00E5FF), bright amber (#FFAA00), vivid purple (#9B30FF). Glowing borders around each panel. Cream (#FAF7F2) background with colorful confetti and dots. No text in image. 16:9 aspect ratio. Ultra high resolution.`,
  
  contact: `Extremely vibrant and colorful flat vector Lottie animation style illustration. Two stylized cartoon professional characters warmly shaking hands with GLOWING communication icons orbiting around them in rainbow colors: neon envelope, glowing phone receiver, pulsing map pin, colorful chat bubbles with sparkles. A large colorful stylized globe in background with neon city lights and connection lines. SUPER SATURATED palette: hot pink (#FF1493), electric orange (#FF6B00), neon cyan (#00E5FF), bright magenta (#FF00FF), golden yellow (#FFD700). Rainbow gradient accents and lens flares. Cream (#FAF7F2) background with colorful geometric decorations and floating circles. Clean center-bottom area for contact card. No text in image. 16:9 aspect ratio. Ultra high resolution.`
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { pageId, language = 'en' } = await req.json() as GenerateRequest;
    
    console.log(`Generating brochure page: ${pageId}, language: ${language}`);

    const prompt = pagePrompts[pageId];
    if (!prompt) {
      console.error(`Unknown page ID: ${pageId}`);
      return new Response(
        JSON.stringify({ error: `Unknown page ID: ${pageId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Using prompt for ${pageId}:`, prompt.substring(0, 100) + '...');

    // Call Lovable AI Gateway with Nano Banana Pro (image generation model)
    // CRITICAL: Must use modalities: ["image", "text"] for image generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI Gateway response received");

    // Extract image from response - format per ai-image-generation docs:
    // data.choices[0].message.images[0].image_url.url contains "data:image/png;base64,..."
    const images = data.choices?.[0]?.message?.images;
    
    if (!images || images.length === 0) {
      console.error("No images in AI response:", JSON.stringify(data).substring(0, 1000));
      throw new Error("No images in AI response");
    }

    const imageUrl = images[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("Could not extract image URL from response");
      console.error("Images structure:", JSON.stringify(images).substring(0, 500));
      throw new Error("Could not extract image URL from AI response");
    }

    console.log(`Successfully generated image for page: ${pageId}, image data length: ${imageUrl.length}`);

    return new Response(
      JSON.stringify({ 
        pageId,
        imageUrl,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-brochure-page:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
