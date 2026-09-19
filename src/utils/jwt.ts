import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

interface TokenPayload {
  userId: string;
  role: string;
}

function parseExpiresIn(value: string): number {
  const unit = value.slice(-1);
  const num = parseInt(value.slice(0, -1), 10);
  
  switch (unit) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 60 * 60;
    case 'd': return num * 60 * 60 * 24;
    default: return num;
  }
}

export function signAccessToken(userId: string, role: string): string {
  const payload: TokenPayload = { userId, role };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: parseExpiresIn(env.JWT_ACCESS_EXPIRES_IN) });
}

export function signRefreshToken(userId: string, role: string): string {
  const payload: TokenPayload = { userId, role };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN) });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
