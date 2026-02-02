export interface AuthSession {
  id: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; 
