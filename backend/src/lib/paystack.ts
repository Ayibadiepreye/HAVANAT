// Paystack HTTP client. Uses PAYSTACK_SECRET_KEY from env.
// Docs: https://paystack.com/docs/api

import crypto from 'node:crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';

function getKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY ?? '';
  if (!key || (!key.startsWith('sk_test_') && !key.startsWith('sk_live_'))) {
    throw new Error('PAYSTACK_SECRET_KEY missing or malformed. Expected sk_test_... or sk_live_...');
  }
  return key;
}

export function isPaystackConfigured(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY ?? '';
  return key.startsWith('sk_test_') || key.startsWith('sk_live_');
}

export function paystackMode(): 'test' | 'live' | 'none' {
  const key = process.env.PAYSTACK_SECRET_KEY ?? '';
  if (key.startsWith('sk_live_')) return 'live';
  if (key.startsWith('sk_test_')) return 'test';
  return 'none';
}

async function paystackFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const data = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !data.status) {
    const msg = (data && data.message) || `Paystack ${res.status}`;
    throw new Error(msg);
  }
  return data.data as T;
}

export interface InitializeTransactionInput {
  email: string;
  amount: number; // in kobo (smallest unit). NGN: 1 naira = 100 kobo.
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  currency?: string;
}

export interface InitializeTransactionResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(input: InitializeTransactionInput): Promise<InitializeTransactionResult> {
  return paystackFetch<InitializeTransactionResult>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount),
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
      currency: input.currency ?? 'NGN',
    }),
  });
}

export interface VerifyTransactionResult {
  id: number;
  status: 'success' | 'failed' | 'abandoned' | 'pending';
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  channel: string;
  customer: { email: string; customer_code?: string };
  metadata?: Record<string, unknown>;
}

export async function verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
  return paystackFetch<VerifyTransactionResult>(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
  });
}

/** Initiate a refund. amount in kobo, optional. */
export async function refundTransaction(reference: string, amount?: number): Promise<{ id: number; status: string; amount: number }> {
  return paystackFetch<{ id: number; status: string; amount: number }>('/refund', {
    method: 'POST',
    body: JSON.stringify({ transaction: reference, amount }),
  });
}

/** Verify webhook signature. Paystack signs with HMAC-SHA512 using the secret key. */
export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const hash = crypto.createHmac('sha512', getKey()).update(rawBody).digest('hex');
  return hash === signature;
}
