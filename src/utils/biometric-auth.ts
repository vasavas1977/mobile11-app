/**
 * WebAuthn biometric authentication utility for the Agent Portal.
 * 
 * Uses the Web Authentication API to register and authenticate with
 * Face ID, Touch ID, fingerprint, or other platform authenticators.
 * 
 * This acts as a "fast unlock" — on successful biometric auth,
 * we check if a valid Supabase session exists and restore it.
 */

const RP_NAME = 'Agent Portal';
const RP_ID_KEY = 'agent_biometric_rp_id';
const CREDENTIAL_KEY = 'agent_biometric_credential';

function getRpId(): string {
  return window.location.hostname;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Check if the device supports biometric/platform authentication */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Check if a biometric credential is already registered for this device */
export function hasBiometricCredential(): boolean {
  return !!localStorage.getItem(CREDENTIAL_KEY);
}

/** Get the email associated with the stored biometric credential */
export function getBiometricEmail(): string | null {
  const stored = localStorage.getItem(CREDENTIAL_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored).email || null;
  } catch {
    return null;
  }
}

/** Register a new biometric credential after successful login */
export async function registerBiometric(email: string, userId: string): Promise<boolean> {
  try {
    const rpId = getRpId();
    const userIdBuffer = new TextEncoder().encode(userId);
    
    const credential = await navigator.credentials.create({
      publicKey: {
        rp: { name: RP_NAME, id: rpId },
        user: {
          id: userIdBuffer,
          name: email,
          displayName: email,
        },
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Only biometric/device auth
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential;

    if (!credential) return false;

    const credentialData = {
      id: credential.id,
      rawId: bufferToBase64(credential.rawId),
      email,
      userId,
      rpId,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(credentialData));
    localStorage.setItem(RP_ID_KEY, rpId);
    return true;
  } catch (error) {
    console.warn('Biometric registration failed:', error);
    return false;
  }
}

/** Authenticate with a stored biometric credential */
export async function authenticateWithBiometric(): Promise<{ success: boolean; email?: string; userId?: string }> {
  const stored = localStorage.getItem(CREDENTIAL_KEY);
  if (!stored) return { success: false };

  try {
    const credentialData = JSON.parse(stored);
    const rpId = credentialData.rpId || getRpId();

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId,
        allowCredentials: [{
          type: 'public-key',
          id: base64ToBuffer(credentialData.rawId),
        }],
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential;

    if (!assertion) return { success: false };

    return {
      success: true,
      email: credentialData.email,
      userId: credentialData.userId,
    };
  } catch (error) {
    console.warn('Biometric authentication failed:', error);
    return { success: false };
  }
}

/** Remove the stored biometric credential */
export function removeBiometricCredential(): void {
  localStorage.removeItem(CREDENTIAL_KEY);
  localStorage.removeItem(RP_ID_KEY);
}
