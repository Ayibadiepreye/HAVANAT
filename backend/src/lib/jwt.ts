import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config.js';

export interface JwtPayload {
  sub: string;        // user id
  email: string;
  role: 'customer' | 'admin' | 'moderator' | 'rider';
  tier?: 'standard' | 'deluxe' | 'elite';
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtAccessSecret, { expiresIn: config.jwtAccessTtl } as SignOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshTtl,
    jwtid: crypto.randomUUID(),
  } as SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtAccessSecret) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
  } catch {
    return null;
  }
}
