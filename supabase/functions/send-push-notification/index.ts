import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Helpers ──────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const cleaned = base64String.trim().replace(/\s/g, '');
  const padding = '='.repeat((4 - cleaned.length % 4) % 4);
  const base64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/');

  // Manual base64 decode (no atob dependency)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const len = base64.length;
  let bufferLength = Math.floor(len * 3 / 4);
  if (base64[len - 1] === '=') bufferLength--;
  if (base64[len - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = lookup[base64.charCodeAt(i)];
    const e2 = lookup[base64.charCodeAt(i + 1)];
    const e3 = lookup[base64.charCodeAt(i + 2)];
    const e4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < bufferLength) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < bufferLength) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const a of arrays) { result.set(a, offset); offset += a.length; }
  return result;
}

// ── HKDF (RFC 5869) using Web Crypto ─────────────────────────────

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', salt as any, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = await crypto.subtle.sign('HMAC', key, ikm as any);
  return new Uint8Array(prk);
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', prk as any, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const infoWithCounter = concatUint8Arrays(info, new Uint8Array([1]));
  const okm = await crypto.subtle.sign('HMAC', key, infoWithCounter as any);
  return new Uint8Array(okm).slice(0, length);
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const prk = await hkdfExtract(salt, ikm);
  return hkdfExpand(prk, info, length);
}

// ── Build info strings per RFC 8291 ──────────────────────────────

function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(type);
  // "Content-Encoding: <type>\0" + "P-256\0" + len(recipient) + recipient + len(sender) + sender
  const header = encoder.encode('Content-Encoding: ');
  const nul = new Uint8Array([0]);
  const p256 = encoder.encode('P-256');

  const clientLen = new Uint8Array(2);
  new DataView(clientLen.buffer).setUint16(0, clientPublicKey.length);

  const serverLen = new Uint8Array(2);
  new DataView(serverLen.buffer).setUint16(0, serverPublicKey.length);

  return concatUint8Arrays(
    header, typeBytes, nul,
    p256, nul,
    clientLen, clientPublicKey,
    serverLen, serverPublicKey
  );
}

// ── RFC 8291: Encrypt push payload ──────────────────────────────

async function encryptPayload(
  clientPublicKeyBase64: string,
  clientAuthBase64: string,
  payload: string
): Promise<{ ciphertext: Uint8Array; serverPublicKeyBytes: Uint8Array; salt: Uint8Array }> {
  const clientPublicKeyBytes = urlBase64ToUint8Array(clientPublicKeyBase64);
  const clientAuthBytes = urlBase64ToUint8Array(clientAuthBase64);
  const payloadBytes = new TextEncoder().encode(payload);

  // Generate ephemeral server ECDH key pair
  const serverKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export server public key (uncompressed, 65 bytes)
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey));

  // Import client public key
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKeyBytes as any,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeys.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Generate 16-byte random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // IKM = HKDF(clientAuth, sharedSecret, "Content-Encoding: auth\0", 32)
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const ikm = await hkdf(clientAuthBytes, sharedSecret, authInfo, 32);

  // Derive content encryption key (CEK): 16 bytes
  const cekInfo = createInfo('aesgcm', clientPublicKeyBytes, serverPublicKeyRaw);
  const cek = await hkdf(salt, ikm, cekInfo, 16);

  // Derive nonce: 12 bytes
  const nonceInfo = createInfo('nonce', clientPublicKeyBytes, serverPublicKeyRaw);
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Pad payload (2-byte padding length prefix + payload)
  const paddingLength = 0;
  const paddingLenBytes = new Uint8Array(2);
  new DataView(paddingLenBytes.buffer).setUint16(0, paddingLength);
  const paddedPayload = concatUint8Arrays(paddingLenBytes, payloadBytes);

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey('raw', cek as any, { name: 'AES-GCM' }, false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce as any },
    aesKey,
    paddedPayload as any
  );

  return {
    ciphertext: new Uint8Array(encrypted),
    serverPublicKeyBytes: serverPublicKeyRaw,
    salt,
  };
}

// ── VAPID JWT ────────────────────────────────────────────────────

async function createVapidJwt(audience: string, subject: string, privateKeyBase64: string, publicKeyBase64: string): Promise<string> {
  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify({ alg: 'ES256', typ: 'JWT' })));
  const now = Math.floor(Date.now() / 1000);
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: subject })));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Strip any non-base64url characters (newlines, spaces, invisible chars)
  const cleanPrivateKey = privateKeyBase64.replace(/[^A-Za-z0-9\-_]/g, '');
  const cleanPublicKey = publicKeyBase64.replace(/[^A-Za-z0-9\-_]/g, '');

  console.log(`[send-push] VAPID clean private key length: ${cleanPrivateKey.length}, clean public key length: ${cleanPublicKey.length}`);

  const privateKeyBytes = urlBase64ToUint8Array(cleanPrivateKey);
  let publicKeyBytes = urlBase64ToUint8Array(cleanPublicKey);

  // P-256 uncompressed public key must be exactly 65 bytes (0x04 + 32x + 32y)
  if (publicKeyBytes.length > 65 && publicKeyBytes[0] === 0x04) {
    console.log(`[send-push] Trimming public key from ${publicKeyBytes.length} to 65 bytes`);
    publicKeyBytes = publicKeyBytes.slice(0, 65);
  }

  console.log(`[send-push] Decoded private key bytes: ${privateKeyBytes.length}, public key bytes: ${publicKeyBytes.length}`);

  // Build JWK from raw key bytes for Deno compatibility
  // (Deno's Web Crypto doesn't support 'raw' format for EC private keys)
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: uint8ArrayToBase64Url(privateKeyBytes),
    x: uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65)),
  };

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken) as any
  );

  // Convert DER signature to raw r||s format (64 bytes) if needed
  const sigBytes = new Uint8Array(signatureBuffer);
  let rawSig: Uint8Array;
  
  if (sigBytes.length !== 64) {
    // DER encoded - parse it
    rawSig = derToRaw(sigBytes);
  } else {
    rawSig = sigBytes;
  }

  return `${unsignedToken}.${uint8ArrayToBase64Url(rawSig)}`;
}

function derToRaw(der: Uint8Array): Uint8Array {
  // DER: 0x30 <len> 0x02 <rLen> <r> 0x02 <sLen> <s>
  const raw = new Uint8Array(64);
  let offset = 2; // skip 0x30 <totalLen>
  
  // R
  offset++; // skip 0x02
  const rLen = der[offset++];
  const rStart = offset;
  offset += rLen;
  
  // S
  offset++; // skip 0x02
  const sLen = der[offset++];
  const sStart = offset;
  
  // Copy R (right-aligned in 32 bytes)
  const rBytes = der.slice(rStart, rStart + rLen);
  const rPadded = rLen > 32 ? rBytes.slice(rLen - 32) : rBytes;
  raw.set(rPadded, 32 - rPadded.length);
  
  // Copy S (right-aligned in 32 bytes)
  const sBytes = der.slice(sStart, sStart + sLen);
  const sPadded = sLen > 32 ? sBytes.slice(sLen - 32) : sBytes;
  raw.set(sPadded, 64 - sPadded.length);
  
  return raw;
}

// ── Notification types ───────────────────────────────────────────

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: { url?: string; [key: string]: unknown };
}

// ── Main handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!.replace(/[^A-Za-z0-9\-_]/g, '');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!.replace(/[^A-Za-z0-9\-_]/g, '');
    // Apple requires strictly formatted mailto: URL — strip spaces, angle brackets
    let vapidSubject = Deno.env.get('VAPID_SUBJECT')!.trim();
    vapidSubject = vapidSubject.replace(/[<>]/g, '').replace(/mailto:\s+/i, 'mailto:');
    if (!vapidSubject.startsWith('mailto:') && !vapidSubject.startsWith('https://')) {
      vapidSubject = `mailto:${vapidSubject}`;
    }

    const CLIENT_KEY = 'BOncjwLlzFaE8yMUzSTZiww8WybG491PghSkYfmjO7kht8ZTkVi-wQ-WqGHId0wI0i5lKaQjP6IToSMOhnGSmgA';
    console.log(`[send-push] Key match: ${vapidPublicKey === CLIENT_KEY}, subject: "${vapidSubject}"`);

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.error('[send-push] Missing VAPID config');
      return new Response(JSON.stringify({ error: 'Push service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, userIds, notification } = await req.json() as {
      userId?: string; userIds?: string[]; notification: NotificationPayload;
    };

    if (!notification?.title || !notification?.body) {
      return new Response(JSON.stringify({ error: 'notification.title and .body required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Query subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    if (userId) query = query.eq('user_id', userId);
    else if (userIds?.length) query = query.in('user_id', userIds);

    const { data: subscriptions, error: queryError } = await query;
    if (queryError) {
      console.error('[send-push] DB error:', queryError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!subscriptions?.length) {
      console.log('[send-push] No subscriptions found');
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No subscribers' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[send-push] Sending to ${subscriptions.length} subscription(s)`);

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/favicon-512.png',
      badge: notification.badge || '/favicon-512.png',
      tag: notification.tag || 'mobile11-notification',
      data: notification.data || {},
    });

    const results = { sent: 0, failed: 0, expired: [] as string[] };

    for (const sub of subscriptions) {
      try {
        const endpoint = new URL(sub.endpoint);
        const audience = `${endpoint.protocol}//${endpoint.host}`;

        // Create VAPID JWT
        const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey, vapidPublicKey);

        // Encrypt the payload using RFC 8291
        const { ciphertext, serverPublicKeyBytes, salt } = await encryptPayload(
          sub.p256dh,
          sub.auth,
          payload
        );

        // Build the request
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aesgcm',
            'TTL': '86400',
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            'Urgency': 'high',
            'Crypto-Key': `dh=${uint8ArrayToBase64Url(serverPublicKeyBytes)};p256ecdsa=${vapidPublicKey}`,
            'Encryption': `salt=${uint8ArrayToBase64Url(salt)}`,
          },
          body: ciphertext,
        });

        if (response.ok || response.status === 201) {
          results.sent++;
          console.log(`[send-push] ✅ Sent to ${sub.user_id}`);
        } else if (response.status === 410 || response.status === 404) {
          results.expired.push(sub.id);
          console.log(`[send-push] ⚠️ Subscription expired for ${sub.user_id}`);
        } else {
          results.failed++;
          const errorText = await response.text();
          console.error(`[send-push] ❌ Failed for ${sub.user_id}: ${response.status} - ${errorText}`);
        }
      } catch (error: any) {
        results.failed++;
        console.error(`[send-push] ❌ Error for ${sub.user_id}:`, error);
      }
    }

    // Clean up expired subscriptions
    if (results.expired.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', results.expired);
      console.log(`[send-push] Cleaned ${results.expired.length} expired sub(s)`);
    }

    return new Response(
      JSON.stringify({ success: true, sent: results.sent, failed: results.failed, expired: results.expired.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[send-push] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
