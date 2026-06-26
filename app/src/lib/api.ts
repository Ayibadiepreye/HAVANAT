// Unified API client. Reads VITE_API_URL (defaults to http://localhost:4000).
// When VITE_USE_BACKEND === 'true', stores use this client. When false, falls back to mocks.

// VITE_API_URL behaviour:
//   - If explicitly set (e.g. 'https://api.example.com'), use that absolute URL
//   - If not set, use a relative path (same origin) — works with Vite proxy in dev,
//     Vercel rewrites in production, or any same-origin deployment
const API_URL = (import.meta.env.VITE_API_URL as string) ?? '';
const USE_BACKEND = (import.meta.env.VITE_USE_BACKEND as string) === 'true';

export const apiConfig = {
  baseUrl: API_URL,
  useBackend: USE_BACKEND,
  // Cloudinary config — products uploaded here, served via Cloudinary CDN
  cloudinaryCloudName: (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || '',
  cloudinaryUploadPreset: (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || '',
  // Paystack public key (frontend-safe)
  paystackPublicKey: (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string) || '',
};

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
  }
}

function getAccessToken(): string | null {
  try {
    return JSON.parse(localStorage.getItem('havanat-auth') || '{}')?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown; headers?: Record<string, string>; auth?: boolean } = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, auth = false } = options;
  const h: Record<string, string> = { 'Content-Type': 'application/json', ...headers };
  if (auth) {
    const token = getAccessToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  // If API_URL is set, use absolute; otherwise use relative (browser resolves against current origin)
  const base = API_URL;
  const res = await fetch(`${base}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.error || data?.message || res.statusText;
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

// Convenience helpers
export const apiGet = <T,>(path: string, auth = false) => api<T>(path, { auth });
export const apiPost = <T,>(path: string, body?: unknown, auth = true) => api<T>(path, { method: 'POST', body, auth });
export const apiPut = <T,>(path: string, body?: unknown, auth = true) => api<T>(path, { method: 'PUT', body, auth });
export const apiPatch = <T,>(path: string, body?: unknown, auth = true) => api<T>(path, { method: 'PATCH', body, auth });
export const apiDelete = <T,>(path: string, auth = true) => api<T>(path, { method: 'DELETE', auth });

// Cloudinary unsigned upload (for product images, lookbook, avatars, etc.)
export async function uploadToCloudinary(file: File): Promise<string> {
  if (!apiConfig.cloudinaryCloudName || !apiConfig.cloudinaryUploadPreset) {
    throw new Error('Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', apiConfig.cloudinaryUploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${apiConfig.cloudinaryCloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return data.secure_url as string;
}

// Paystack redirect — opens Paystack checkout
export async function payWithPaystack(opts: {
  email: string;
  amount: number; // in kobo (multiply naira by 100)
  reference: string;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}): Promise<void> {
  if (!apiConfig.paystackPublicKey) {
    throw new Error('Paystack not configured. Set VITE_PAYSTACK_PUBLIC_KEY.');
  }
  // Load Paystack inline script if not loaded
  if (!(window as any).PaystackPop) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.paystack.co/v1/inline.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Paystack script'));
      document.head.appendChild(s);
    });
  }
  const handler = (window as any).PaystackPop.setup({
    key: apiConfig.paystackPublicKey,
    email: opts.email,
    amount: opts.amount,
    ref: opts.reference,
    metadata: opts.metadata,
    callback: (response: { reference: string }) => opts.onSuccess(response.reference),
    onClose: () => opts.onClose(),
  });
  handler.openIframe();
}