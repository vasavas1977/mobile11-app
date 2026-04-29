import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting OG image generation with Nano Banana Pro model...');

    const prompt = `Professional eSIM travel marketing banner in flat Lottie animation style. 
1200x630 pixels, 16:9 aspect ratio for Open Graph social media preview.

LEFT SIDE (40%): 
- "Mobile11" text in bold modern sans-serif font, dark navy blue color
- "eSIM for Travel" tagline below in orange (#F97316)
- "Unlimited Data • 151 Countries" subtitle in gray
- Clean minimal layout with plenty of whitespace

RIGHT SIDE (60%):
- Flat vector illustration of happy diverse travelers holding smartphones showing eSIM
- Iconic world landmarks in minimal flat style: Eiffel Tower, Mt Fuji, Statue of Liberty, Big Ben
- Small airplane silhouettes flying
- Stylized globe/world map elements
- SIM card icon floating

STYLE: Clean flat vector illustration exactly like Lottie animations, 
warm cream/beige (#FAF7F2) background, 
orange (#F97316) and teal (#14B8A6) accent colors,
modern minimalist design, NO gradients, solid flat colors only,
thin clean outlines, cute friendly aesthetic like Airalo marketing.

Ultra high resolution, professional marketing quality.`;

    console.log('Calling Lovable AI Gateway with google/gemini-3-pro-image-preview...');

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
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Payment required. Please add credits to your Lovable AI workspace." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI Gateway response received:', JSON.stringify(data));

    // Extract the image URL from the response - check multiple possible locations
    let imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // Also check for inline_data format
    if (!imageUrl && data.choices?.[0]?.message?.content) {
      // Check if the content includes base64 image data
      const content = data.choices[0].message.content;
      if (typeof content === 'object' && content.parts) {
        for (const part of content.parts) {
          if (part.inline_data?.mime_type?.startsWith('image/')) {
            imageUrl = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            break;
          }
        }
      }
    }
    
    if (!imageUrl) {
      console.error('No image URL in response. Full response:', JSON.stringify(data));
      
      // Return the text content anyway for debugging
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No image generated',
        textContent: data.choices?.[0]?.message?.content,
        fullResponse: data
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Image generated successfully');

    return new Response(JSON.stringify({ 
      success: true,
      imageUrl: imageUrl,
      message: 'Lottie-style OG image generated successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('Error generating OG image:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
