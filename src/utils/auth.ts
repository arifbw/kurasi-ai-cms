import { AuthSession, SESSION_DURATION_MS } from '../types/auth';
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedHashBytes = combined.slice(16);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const derivedHashBytes = new Uint8Array(derivedBits);
    if (derivedHashBytes.length !== storedHashBytes.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < derivedHashBytes.length; i++) {
      result |= derivedHashBytes[i] ^ storedHashBytes[i];
    }

    return result === 0;
  } catch {
    return false;
  }
}

export function isSessionExpired(session: AuthSession | null): boolean {
  if (!session) return true;
  return Date.now() > session.expiresAt;
}

export function createSession(username: string): AuthSession {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    username,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };
}

export function refreshSession(session: AuthSession): AuthSession {
  return {
    ...session,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
}
