import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'LINE_CHANNEL_ACCESS_TOKEN not set' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 1: Create a Rich Menu
    const richMenuBody = {
      size: { width: 2500, height: 843 },
      selected: true,
      name: "Mobile11 Menu",
      chatBarText: "Menu",
      areas: [
        {
          bounds: { x: 0, y: 0, width: 1250, height: 843 },
          action: { type: "message", label: "Talk to Agent", text: "agent" }
        },
        {
          bounds: { x: 1250, y: 0, width: 1250, height: 843 },
          action: { type: "uri", label: "Browse eSIM", uri: "https://mobile11.com/esim" }
        }
      ]
    };

    console.log('Creating LINE Rich Menu...');
    const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(richMenuBody)
    });

    const createResult = await createRes.json();
    console.log('Rich Menu created:', JSON.stringify(createResult));

    if (!createRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to create rich menu', details: createResult }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const richMenuId = createResult.richMenuId;

    // Step 2: Upload a rich menu image (generate a simple one)
    // Create a simple 2500x843 image with two buttons using SVG converted to PNG
    // LINE requires an image upload. We'll create a minimal PNG.
    // For a production-quality menu, upload a designed image manually.
    
    // Generate a simple rich menu image using Canvas-like approach
    // Since we can't use Canvas in Deno easily, we'll use a solid color placeholder
    // and recommend uploading a proper image later.
    
    // Create a minimal valid PNG (1x1 pixel, will be stretched - not ideal but functional)
    // Better approach: use an SVG-to-PNG service or upload manually
    
    // For now, let's try uploading a simple colored image via the LINE API
    // LINE accepts JPEG and PNG, 2500x1686 or 2500x843, max 1MB
    
    // We'll generate a simple image with text using a public image generation service
    const imageUrl = `https://placehold.co/2500x843/0066FF/FFFFFF/png?text=🙋+Talk+to+Agent++++++++++🌐+Browse+eSIM&font=roboto`;
    
    console.log('Downloading placeholder image...');
    const imageResponse = await fetch(imageUrl);
    
    if (imageResponse.ok) {
      const imageBlob = await imageResponse.arrayBuffer();
      
      console.log('Uploading rich menu image...');
      const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          'Authorization': `Bearer ${accessToken}`
        },
        body: imageBlob
      });

      const uploadText = await uploadRes.text();
      console.log('Image upload result:', uploadRes.status, uploadText);
      
      if (!uploadRes.ok) {
        console.error('Image upload failed, menu created but without image. Upload manually in LINE dashboard.');
      }
    } else {
      console.error('Failed to download placeholder image, skipping image upload');
    }

    // Step 3: Set as default rich menu for all users
    console.log('Setting as default rich menu...');
    const setDefaultRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const setDefaultText = await setDefaultRes.text();
    console.log('Set default result:', setDefaultRes.status, setDefaultText);

    return new Response(JSON.stringify({
      success: true,
      richMenuId,
      message: 'Rich menu created and set as default. For a better-looking menu, upload a custom image via the LINE Official Account Manager.',
      manualImageUpload: `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
