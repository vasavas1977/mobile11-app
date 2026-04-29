import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LINE_LOGIN_CHANNEL_ID = Deno.env.get('LINE_LOGIN_CHANNEL_ID')!;
const LINE_LOGIN_CHANNEL_SECRET = Deno.env.get('LINE_LOGIN_CHANNEL_SECRET')!;

const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

interface LineTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  id_token: string;
}

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// Decode JWT payload without verification (LINE already validated it)
function decodeJwt(token: string): Record<string, any> {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e: any) {
    console.warn('[LINE Auth] Failed to decode JWT:', e);
    return {};
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Action: Get authorization URL
    if (action === 'authorize') {
      const redirectUri = url.searchParams.get('redirect_uri');
      const state = url.searchParams.get('state') || crypto.randomUUID();
      const disableAutoLogin = url.searchParams.get('disable_auto_login') || 'false';
      // Get ui_locales for LINE login page language (default to 'en')
      const uiLocales = url.searchParams.get('ui_locales') || 'en';
      
      if (!redirectUri) {
        console.error('[LINE Auth] authorize: redirect_uri is missing');
        return new Response(
          JSON.stringify({ error: 'redirect_uri is required', details: 'The redirect_uri parameter was not provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the redirect_uri host for debugging (no sensitive data)
      try {
        const redirectHost = new URL(redirectUri).host;
        console.log('[LINE Auth] authorize: redirect_uri host:', redirectHost);
      } catch {
        console.error('[LINE Auth] authorize: invalid redirect_uri format');
        return new Response(
          JSON.stringify({ error: 'Invalid redirect_uri', details: 'The redirect_uri is not a valid URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINE_LOGIN_CHANNEL_ID,
        redirect_uri: redirectUri,
        state: state,
        scope: 'profile openid email',
        disable_auto_login: disableAutoLogin,
        bot_prompt: 'normal', // Streamlines consent flow for returning users
        ui_locales: uiLocales, // Display LINE login page in user's selected language (th/en)
      });

      const authUrl = `${LINE_AUTH_URL}?${params.toString()}`;

      console.log('[LINE Auth] Generated authorization URL for state:', state.slice(0, 8) + '...', 'disable_auto_login:', disableAutoLogin, 'ui_locales:', uiLocales);

      return new Response(
        JSON.stringify({ authUrl, state }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Exchange code for token and authenticate
    if (action === 'callback' || req.method === 'POST') {
      let code: string | null = null;
      let redirectUri: string | null = null;

      if (req.method === 'POST') {
        const body = await req.json();
        code = body.code;
        redirectUri = body.redirect_uri;
      } else {
        code = url.searchParams.get('code');
        redirectUri = url.searchParams.get('redirect_uri');
      }

      if (!code || !redirectUri) {
        console.error('[LINE Auth] callback: missing code or redirect_uri');
        return new Response(
          JSON.stringify({ error: 'code and redirect_uri are required', details: `code: ${code ? 'present' : 'missing'}, redirect_uri: ${redirectUri ? 'present' : 'missing'}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log redirect_uri host for debugging
      try {
        const redirectHost = new URL(redirectUri).host;
        console.log('[LINE Auth] callback: redirect_uri host:', redirectHost);
      } catch {
        console.error('[LINE Auth] callback: invalid redirect_uri format');
      }

      console.log('[LINE Auth] Exchanging code for token...');

      // Exchange authorization code for access token
      const tokenResponse = await fetch(LINE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: LINE_LOGIN_CHANNEL_ID,
          client_secret: LINE_LOGIN_CHANNEL_SECRET,
        }),
      });

      console.log('[LINE Auth] Token response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[LINE Auth] Token exchange failed (HTTP', tokenResponse.status, '):', errorText);
        
        // Parse LINE's error response for better messaging
        let errorDetail = errorText;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error_description) {
            errorDetail = `${parsed.error}: ${parsed.error_description}`;
          }
        } catch {}
        
        return new Response(
          JSON.stringify({ error: 'Failed to exchange code for token', details: errorDetail }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData: LineTokenResponse = await tokenResponse.json();
      console.log('[LINE Auth] Token obtained successfully');

      // Extract email from ID token (if user granted email permission)
      let userEmailFromLine: string | null = null;
      if (tokenData.id_token) {
        const idTokenPayload = decodeJwt(tokenData.id_token);
        userEmailFromLine = idTokenPayload.email || null;
        console.log('[LINE Auth] Email from ID token:', userEmailFromLine ? 'present' : 'not shared');
      }

      // Fetch LINE user profile
      const profileResponse = await fetch(LINE_PROFILE_URL, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('[LINE Auth] Profile fetch failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch LINE profile', details: errorText }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const lineProfile: LineProfile = await profileResponse.json();
      console.log('[LINE Auth] Profile fetched:', lineProfile.userId, lineProfile.displayName);

      // Check if user already exists with this LINE ID
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('line_user_id', lineProfile.userId)
        .single();

      let userId: string;
      let isNewUser = false;
      // Use real email from LINE if available, fallback to generated email
      const email = userEmailFromLine || `line_${lineProfile.userId}@mobile11.com`;
      const isEmailFromLine = !!userEmailFromLine;

      let accountLinked = false;

      // Helper function to link LINE to existing account
      const linkLineToExistingAccount = async (existingUserId: string) => {
        console.log('[LINE Auth] Linking LINE to existing account:', existingUserId);
        
        // Update the existing profile with LINE metadata
        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({
            line_user_id: lineProfile.userId,
            line_display_name: lineProfile.displayName,
            line_picture_url: lineProfile.pictureUrl || null,
          })
          .eq('user_id', existingUserId);
          
        if (updateProfileError) {
          console.error('[LINE Auth] Profile update failed:', updateProfileError);
        }
        
        // Get current user metadata to merge with LINE info
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(existingUserId);
        
        // Update auth user metadata to include LINE info
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(existingUserId, {
          user_metadata: {
            ...(userData?.user?.user_metadata || {}),
            line_user_id: lineProfile.userId,
            line_display_name: lineProfile.displayName,
            line_picture_url: lineProfile.pictureUrl || null,
          }
        });
        
        if (updateAuthError) {
          console.error('[LINE Auth] Auth user metadata update failed:', updateAuthError);
        }
        
        console.log('[LINE Auth] Successfully linked LINE to existing account:', existingUserId);
      };

      if (existingProfile) {
        // Existing user - get their auth record
        userId = existingProfile.user_id;
        console.log('[LINE Auth] Existing user found by LINE ID:', userId);
      } else {
        // No profile with this LINE ID - check if email already exists in profiles table
        // This is more reliable than listUsers() which is paginated
        const normalizedEmail = email.trim().toLowerCase();
        console.log('[LINE Auth] Checking for existing email in profiles:', normalizedEmail);
        
        const { data: profileByEmail, error: profileLookupError } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .ilike('email', normalizedEmail)
          .maybeSingle();

        if (profileLookupError) {
          console.error('[LINE Auth] Profile email lookup error:', profileLookupError);
        }

        if (profileByEmail) {
          // Email exists with different provider - link LINE to existing account
          userId = profileByEmail.user_id;
          isNewUser = false;
          accountLinked = true;
          
          console.log('[LINE Auth] Email found in profiles, linking LINE to existing account:', userId);
          await linkLineToExistingAccount(userId);
        } else {
          // Email doesn't exist in profiles - try to create new user
          console.log('[LINE Auth] Email not found in profiles, creating new user');
          isNewUser = true;
          
          // Create auth user with LINE metadata
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: {
              auth_provider: 'line',
              line_user_id: lineProfile.userId,
              line_display_name: lineProfile.displayName,
              line_picture_url: lineProfile.pictureUrl || null,
              first_name: lineProfile.displayName,
              full_name: lineProfile.displayName,
            },
          });

          if (createError) {
            // Check if error is "email already exists" - fallback to linking
            const errorMessage = createError.message?.toLowerCase() || '';
            if (errorMessage.includes('email') && (errorMessage.includes('already') || errorMessage.includes('exists') || errorMessage.includes('registered'))) {
              console.log('[LINE Auth] createUser returned email_exists error, attempting fallback link');
              
              // Try to find user by email in auth.users using admin API
              // Use getUserByEmail if available, otherwise try listUsers with filter
              const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers({ 
                page: 1, 
                perPage: 1000 
              });
              const userWithEmail = existingAuthUsers?.users?.find(
                u => u.email?.toLowerCase() === normalizedEmail
              );
              
              if (userWithEmail) {
                userId = userWithEmail.id;
                isNewUser = false;
                accountLinked = true;
                
                console.log('[LINE Auth] Fallback: Found user by email, linking:', userId);
                await linkLineToExistingAccount(userId);
              } else {
                // Still can't find user - this shouldn't happen but return error
                console.error('[LINE Auth] Fallback failed: Cannot find user despite email_exists error');
                return new Response(
                  JSON.stringify({ 
                    error: 'Failed to link account', 
                    details: 'Your email is already registered. Please sign in with your original method (Google/Facebook/Email) first, then link LINE in settings.' 
                  }),
                  { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            } else {
              // Other creation error
              console.error('[LINE Auth] User creation failed:', createError);
              return new Response(
                JSON.stringify({ error: 'Failed to create user', details: createError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else {
            userId = newUser.user.id;
            console.log('[LINE Auth] New user created:', userId);

            // Update profile with LINE data (trigger may have already created it)
            await supabaseAdmin
              .from('profiles')
              .upsert({
                user_id: userId,
                email: email,
                first_name: lineProfile.displayName,
                line_user_id: lineProfile.userId,
                line_display_name: lineProfile.displayName,
                line_picture_url: lineProfile.pictureUrl || null,
                auth_provider: 'line',
              }, { onConflict: 'user_id' });
          }
        }
      }

      // Generate a magic link for automatic sign-in
      const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      if (magicLinkError) {
        console.error('[LINE Auth] Magic link generation failed:', magicLinkError);
        // Return success but without magic link - user can try logging in manually
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: userId,
              email: email,
              line_user_id: lineProfile.userId,
              line_display_name: lineProfile.displayName,
              line_picture_url: lineProfile.pictureUrl,
            },
            isNewUser,
            requiresManualLogin: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[LINE Auth] Authentication successful for user:', userId);

      // Extract token hash from the generated link (prefer hashed_token if available)
      const actionLink = magicLinkData.properties?.action_link;
      const tokenHash =
        (magicLinkData.properties as any)?.hashed_token ||
        (() => {
          if (!actionLink) return '';
          const linkUrl = new URL(actionLink);
          return linkUrl.searchParams.get('token_hash') || linkUrl.searchParams.get('token') || '';
        })();

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: userId,
            email: email,
            line_user_id: lineProfile.userId,
            line_display_name: lineProfile.displayName,
            line_picture_url: lineProfile.pictureUrl,
          },
          isNewUser,
          accountLinked, // Indicates if LINE was linked to an existing account
          isEmailFromLine, // Indicates if email came from LINE vs generated
          // Include the token for auto-login via verifyOtp
          tokenHash: tokenHash,
          email: email,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use ?action=authorize or POST with code' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[LINE Auth] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
