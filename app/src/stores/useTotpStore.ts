// TOTP-based 2FA (RFC 6238). TOTP, not SMS, because:
//   - SMS is the #1 phishing vector in 2025 (NCC + global best practice)
//   - TOTP is offline: codes never leave the user's authenticator app
//   - Recovery codes give users a fallback path
//
// This is a pure-JS TOTP implementation. In production we'd use `otplib` or
// `speakeasy` server-side. The client only stores the secret + verifies locally
// during enrollment (mock); real production would have the server verify.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TotpState {
  enabledAt: string | null;
  secret: string | null;
  recoveryCodes: string[];
  usedRecoveryCodes: string[];
}

interface TotpActions {
  enable: () => { secret: string; recoveryCodes: string[] };
  verify: (otp: string) => Promise<boolean>;
  disable: () => void;
  consumeRecoveryCode: (code: string) => boolean;
  regenerateRecoveryCodes: () => string[];
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Uint8Array {
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  const bits: number[] = [];
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) continue;
    for (let i = 4; i >= 0; i--) bits.push((idx >> i) & 1);
  }
  const out = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < out.length; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    out[i] = b;
  }
  return out;
}

async function hmacSha1(keyBytes: Uint8Array, dataBytes: Uint8Array): Promise<Uint8Array> {
  // Create copies backed by ArrayBuffer (not SharedArrayBuffer) for TS strictness
  const key = new Uint8Array(keyBytes);
  const data = new Uint8Array(dataBytes);
  const cryptoKey = await crypto.subtle.importKey('raw', key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
  return new Uint8Array(sig);
}

async function generateTotp(secret: string, time = Math.floor(Date.now() / 1000), digits = 6, period = 30): Promise<string> {
  const counter = Math.floor(time / period);
  const counterBytes = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) { counterBytes[i] = c & 0xff; c = Math.floor(c / 256); }
  const key = base32Decode(secret);
  const hash = await hmacSha1(key, counterBytes);
  const offset = hash[hash.length - 1] & 0x0f;
  const code = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
  const otp = (code % Math.pow(10, digits)).toString().padStart(digits, '0');
  return otp;
}

function generateSecret(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += BASE32_ALPHABET[bytes[i] % 32];
  return out;
}

function generateRecoveryCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex.slice(0, 8).toUpperCase();
}

export const useTotpStore = create<TotpState>()(
  persist(
    (): TotpState => ({
      enabledAt: null,
      secret: null,
      recoveryCodes: [],
      usedRecoveryCodes: [],
    }),
    { name: 'havanat-totp' }
  )
);

export const totpHelpers = {
  generateSecret,
  generateRecoveryCode,
  generateCode: (secret: string) => generateTotp(secret),
  verifyCode: async (secret: string, code: string): Promise<boolean> => {
    const now = Math.floor(Date.now() / 1000);
    for (const offset of [-30, 0, 30]) {
      const expected = await generateTotp(secret, now + offset);
      if (expected === code) return true;
    }
    return false;
  },
};

export const totpActions: TotpActions = {
  enable: () => {
    const secret = generateSecret();
    const recoveryCodes = Array.from({ length: 10 }, generateRecoveryCode);
    useTotpStore.setState({ enabledAt: new Date().toISOString(), secret, recoveryCodes, usedRecoveryCodes: [] });
    return { secret, recoveryCodes };
  },
  verify: async (otp: string) => {
    const { secret } = useTotpStore.getState();
    if (!secret) return false;
    return totpHelpers.verifyCode(secret, otp);
  },
  disable: () => {
    useTotpStore.setState({ enabledAt: null, secret: null, recoveryCodes: [], usedRecoveryCodes: [] });
  },
  consumeRecoveryCode: (code: string) => {
    const { recoveryCodes, usedRecoveryCodes } = useTotpStore.getState();
    if (!recoveryCodes.includes(code)) return false;
    if (usedRecoveryCodes.includes(code)) return false;
    useTotpStore.setState({ usedRecoveryCodes: [...usedRecoveryCodes, code] });
    return true;
  },
  regenerateRecoveryCodes: () => {
    const recoveryCodes = Array.from({ length: 10 }, generateRecoveryCode);
    useTotpStore.setState({ recoveryCodes, usedRecoveryCodes: [] });
    return recoveryCodes;
  },
};