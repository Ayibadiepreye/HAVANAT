// Client-side rate limiter for throttling sensitive actions
// (login, signup, forgot-password, contact, otp-verify, change-password).
//
// Each tracked action has a small log of timestamps stored in localStorage.
// canAttempt() returns { allowed, retryAfterSec }. Once the max number of
// attempts is reached within the window, the action is locked out and
// retryAfterSec tells the caller how long until the lockout expires.

const STORAGE_KEY = 'havanat-rate-limit';

export const DEFAULT_MAX_ATTEMPTS = 5;
export const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitState {
  // Map of action key -> array of attempt timestamps (ms since epoch)
  attempts: Record<string, number[]>;
}

interface CanAttemptResult {
  allowed: boolean;
  /** Seconds until the next attempt is permitted (only set when not allowed). */
  retryAfterSec?: number;
  /** Number of remaining attempts before lockout. */
  remaining?: number;
}

function readState(): RateLimitState {
  if (typeof window === 'undefined') return { attempts: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempts: {} };
    const parsed = JSON.parse(raw) as RateLimitState;
    if (!parsed || typeof parsed !== 'object' || !parsed.attempts) {
      return { attempts: {} };
    }
    return parsed;
  } catch {
    return { attempts: {} };
  }
}

function writeState(state: RateLimitState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode errors */
  }
}

/**
 * Trim a stored attempt list down to only those within the current window.
 */
function pruneWithinWindow(timestamps: number[], windowMs: number, now: number): number[] {
  const cutoff = now - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

/**
 * Check whether the action is currently allowed. Returns the retry-after
 * seconds if the caller is locked out.
 */
export function canAttempt(
  action: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  windowMs: number = DEFAULT_WINDOW_MS
): CanAttemptResult {
  const state = readState();
  const now = Date.now();
  const log = pruneWithinWindow(state.attempts[action] ?? [], windowMs, now);

  if (log.length < maxAttempts) {
    return { allowed: true, remaining: maxAttempts - log.length };
  }

  // Locked out. retryAfter = (oldest attempt + window) - now
  const oldest = log[0];
  const unlockAt = oldest + windowMs;
  const retryAfterSec = Math.max(1, Math.ceil((unlockAt - now) / 1000));
  return { allowed: false, retryAfterSec };
}

/**
 * Record an attempt against an action. Trims the window before recording.
 */
export function recordAttempt(
  action: string,
  windowMs: number = DEFAULT_WINDOW_MS
): void {
  const state = readState();
  const now = Date.now();
  const log = pruneWithinWindow(state.attempts[action] ?? [], windowMs, now);
  log.push(now);
  state.attempts[action] = log;
  writeState(state);
}

/**
 * Clear the stored attempts for an action. Use on successful verification.
 */
export function resetAttempts(action: string): void {
  const state = readState();
  if (state.attempts[action]) {
    delete state.attempts[action];
    writeState(state);
  }
}

/**
 * Convert a seconds count into a friendly "X minutes" / "X seconds" string.
 */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/**
 * Default actions that get the standard 5/15min policy.
 * Exposed so other modules can reference the same set.
 */
export const RATE_LIMITED_ACTIONS = [
  'login',
  'signup',
  'forgot-password',
  'contact',
  'otp-verify',
  'change-password',
] as const;

export type RateLimitedAction = (typeof RATE_LIMITED_ACTIONS)[number];
