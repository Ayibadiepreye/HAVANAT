// Email-based 2FA. The user enables 2FA from /profile → Security.
// On login (future), after password, the user must enter a 6-digit code
// we send to their email.
//
// Backend cutover:
//   - On enable, server generates a secret and stores it encrypted
//   - On login, server generates a 6-digit OTP, emails it via Resend, expires in 10 min
//   - On verify, server compares; OTP is single-use
//
// Mock flow:
//   - enable() flips the flag locally + generates a recovery code
//   - sendCode() logs the code to console + persists to localStorage so /login can verify
//   - verify() checks the persisted code

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TwoFactorState {
  enabled: boolean;
  /** Recovery codes (one-time-use) — printed when 2FA is enabled */
  recoveryCodes: string[];
  usedRecoveryCodes: string[];
  /** Currently pending OTP (the one we just "emailed") */
  pendingCode: string | null;
  pendingCodeExpiresAt: number | null;
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateRecoveryCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex.slice(0, 8).toUpperCase();
}

export const useTwoFactorStore = create<TwoFactorState>()(
  persist(
    (): TwoFactorState => ({
      enabled: false,
      recoveryCodes: [],
      usedRecoveryCodes: [],
      pendingCode: null,
      pendingCodeExpiresAt: null,
    }),
    { name: 'havanat-2fa-email' }
  )
);

export const twoFactorActions = {
  enable: (): { recoveryCodes: string[] } => {
    const recoveryCodes = Array.from({ length: 10 }, generateRecoveryCode);
    useTwoFactorStore.setState({ enabled: true, recoveryCodes, usedRecoveryCodes: [] });
    return { recoveryCodes };
  },
  disable: (): void => {
    useTwoFactorStore.setState({
      enabled: false,
      recoveryCodes: [],
      usedRecoveryCodes: [],
      pendingCode: null,
      pendingCodeExpiresAt: null,
    });
  },
  /**
   * Mock: generate a 6-digit code, "email" it (console.info),
   * and persist for 10 minutes so the verify step can pass.
   */
  sendCode: (recipientEmail: string): string => {
    const code = generateCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    useTwoFactorStore.setState({ pendingCode: code, pendingCodeExpiresAt: expiresAt });
    // eslint-disable-next-line no-console
    console.info(`[mock-email] To: ${recipientEmail} — Your Havanat verification code is ${code}. It expires in 10 minutes.`);
    return code;
  },
  /**
   * Mock: verify a 6-digit code against the pending one (or a recovery code).
   */
  verify: (input: string): boolean => {
    const state = useTwoFactorStore.getState();
    if (!state.enabled) return false;
    const normalized = input.trim().toUpperCase();
    // Try OTP first
    if (state.pendingCode && state.pendingCodeExpiresAt && Date.now() < state.pendingCodeExpiresAt) {
      if (input.trim() === state.pendingCode) {
        useTwoFactorStore.setState({ pendingCode: null, pendingCodeExpiresAt: null });
        return true;
      }
    }
    // Try recovery code
    if (state.recoveryCodes.includes(normalized) && !state.usedRecoveryCodes.includes(normalized)) {
      useTwoFactorStore.setState({ usedRecoveryCodes: [...state.usedRecoveryCodes, normalized] });
      return true;
    }
    return false;
  },
  regenerateRecoveryCodes: (): string[] => {
    const recoveryCodes = Array.from({ length: 10 }, generateRecoveryCode);
    useTwoFactorStore.setState({ recoveryCodes, usedRecoveryCodes: [] });
    return recoveryCodes;
  },
};
