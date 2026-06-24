// Client-side password security helpers.
//
// 1. checkPasswordBreached — uses the public HaveIBeenPwned k-anonymity
//    API to check whether a password has been seen in a known breach.
//    Only the first 5 chars of the SHA-1 hash are ever sent over the wire.
//
// 2. getPasswordStrength — a local heuristic that returns a 0-4 score
//    plus a label and human-friendly feedback.

export type PasswordStrengthLabel =
  | 'Very weak'
  | 'Weak'
  | 'Fair'
  | 'Strong'
  | 'Very strong';

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: PasswordStrengthLabel;
  feedback: string[];
}

export interface BreachCheckResult {
  breached: boolean;
  /** How many times the password has been seen (0 if not found in the response). */
  count: number;
}

// ───────────────────────── SHA-1 ─────────────────────────
//
// Web Crypto exposes SHA-1 via subtle.digest. It's available in every modern
// browser. We only use it to fingerprint a password — the prefix never
// leaves the device, and the suffix is checked against a leaked-hash list
// in the clear (which is fine because hashes are public).
async function sha1Hex(input: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API is not available in this environment.');
  }
  const bytes = new TextEncoder().encode(input);
  const digest = await window.crypto.subtle.digest('SHA-1', bytes);
  const view = new Uint8Array(digest);
  let out = '';
  for (let i = 0; i < view.length; i += 1) {
    out += view[i].toString(16).padStart(2, '0');
  }
  return out.toUpperCase();
}

// ───────────────────────── HIBP ─────────────────────────

const HIBP_ENDPOINT = 'https://api.pwnedpasswords.com/range/';
const HIBP_TIMEOUT_MS = 8000;

/**
 * Look up a password against the HaveIBeenPwned k-anonymity API.
 * Returns { breached, count } where count is the number of times the
 * exact hash has appeared in the HIBP corpus.
 */
export async function checkPasswordBreached(
  plainPassword: string
): Promise<BreachCheckResult> {
  if (!plainPassword) {
    return { breached: false, count: 0 };
  }

  let hash: string;
  try {
    hash = await sha1Hex(plainPassword);
  } catch {
    // If SHA-1 isn't available we cannot perform the check. Fail safe by
    // saying "not breached" rather than blocking the user.
    return { breached: false, count: 0 };
  }

  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);

  try {
    const res = await fetch(HIBP_ENDPOINT + prefix, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Add-Padding': 'true' },
    });
    window.clearTimeout(timeoutId);
    if (!res.ok) {
      return { breached: false, count: 0 };
    }
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const [s, c] = line.split(':');
      if (!s || !c) continue;
      if (s.trim().toUpperCase() === suffix) {
        const count = Number.parseInt(c.trim(), 10);
        return { breached: true, count: Number.isFinite(count) ? count : 0 };
      }
    }
    return { breached: false, count: 0 };
  } catch {
    window.clearTimeout(timeoutId);
    return { breached: false, count: 0 };
  }
}

// ───────────────────────── Strength ─────────────────────────

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  'qwerty',
  'qwerty123',
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  'iloveyou',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'sunshine',
  'princess',
]);

function hasSequentialRun(value: string, length: number): boolean {
  if (value.length < length) return false;
  for (let i = 0; i <= value.length - length; i += 1) {
    let ascending = true;
    let descending = true;
    for (let j = 1; j < length; j += 1) {
      const a = value.charCodeAt(i + j - 1);
      const b = value.charCodeAt(i + j);
      if (b !== a + 1) ascending = false;
      if (b !== a - 1) descending = false;
      if (!ascending && !descending) break;
    }
    if (ascending || descending) return true;
  }
  return false;
}

function hasRepeating(value: string, length: number): boolean {
  if (value.length < length) return false;
  const re = new RegExp(`(.)\\1{${length - 1}}`);
  return re.test(value);
}

/**
 * Score a password from 0-4 and return a human-friendly label and feedback.
 * Returns score 0 / "Very weak" for an empty input.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  const value = password ?? '';

  if (!value) {
    return { score: 0, label: 'Very weak', feedback: ['Enter a password.'] };
  }

  const lower = value.toLowerCase();
  let score = 0;
  const tests = {
    length8: value.length >= 8,
    length12: value.length >= 12,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    digit: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
    notCommon: !COMMON_PASSWORDS.has(lower),
    noSequence: !hasSequentialRun(value, 4),
    noRepeat: !hasRepeating(value, 4),
  };

  if (tests.length8) score += 1;
  if (tests.length12) score += 1;
  if (tests.upper && tests.lower) score += 1;
  if (tests.digit) score += 1;
  if (tests.symbol) score += 1;

  // Deductions
  if (!tests.notCommon) {
    score = Math.max(0, score - 2);
    feedback.push('This password is on a commonly-used list.');
  }
  if (!tests.noSequence) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid sequential characters (e.g. 1234, abcd).');
  }
  if (!tests.noRepeat) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeated characters (e.g. aaaa, 1111).');
  }

  // Constructive feedback for missing characteristics.
  if (!tests.length8) feedback.push('Use at least 8 characters.');
  else if (!tests.length12) feedback.push('Consider 12+ characters for a stronger password.');
  if (!tests.upper) feedback.push('Add an uppercase letter.');
  if (!tests.lower) feedback.push('Add a lowercase letter.');
  if (!tests.digit) feedback.push('Add a number.');
  if (!tests.symbol) feedback.push('Add a symbol such as ! @ #.');

  const finalScore = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;
  const labels: PasswordStrengthLabel[] = [
    'Very weak',
    'Weak',
    'Fair',
    'Strong',
    'Very strong',
  ];
  return {
    score: finalScore,
    label: labels[finalScore],
    feedback: feedback.length ? feedback : ['Looks good — keep this password to yourself.'],
  };
}

/**
 * Convenience helper — the numeric label used by getPasswordStrength.
 * Returned alongside the full object so callers don't need to map.
 */
export function getPasswordStrengthLabel(score: 0 | 1 | 2 | 3 | 4): PasswordStrengthLabel {
  return (['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'] as const)[score];
}
