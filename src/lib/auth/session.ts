const encoder = new TextEncoder();
const subtleCrypto = typeof crypto !== 'undefined' ? crypto.subtle : undefined;

export const SESSION_COOKIE = 'art-class-auth';
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function signPayload(payload: string) {
  if (!subtleCrypto) {
    throw new Error('Web Crypto API is not available in this runtime');
  }

  const secret = process.env.APP_PASSWORD;
  if (!secret) {
    throw new Error('APP_PASSWORD is not set');
  }

  const data = encoder.encode(`${payload}:${secret}`);
  const digest = await subtleCrypto.digest('SHA-256', data);
  return toHex(digest).slice(0, 32);
}

export async function generateSessionToken(expiresAt: number) {
  const signature = await signPayload(`${expiresAt}`);
  return `${expiresAt}.${signature}`;
}

export async function validateSessionToken(token: string, now: number = Date.now()) {
  const [expiresAtStr, signature] = token.split('.');
  const expiresAt = Number(expiresAtStr);
  if (!expiresAt || !signature) {
    return false;
  }

  if (now > expiresAt) {
    return false;
  }

  try {
    const expectedSignature = await signPayload(expiresAtStr);
    return signature === expectedSignature;
  } catch (error) {
    console.error('Auth validation failed:', error);
    return false;
  }
}
