import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`[config] Missing env var: ${key} — using empty string. Set it in .env or your host.`);
    return '';
  }
  return value;
}

function bool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === '1' || v.toLowerCase() === 'true';
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '1h',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((s) => s.trim()),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 120),
  isProd: bool('NODE_ENV', false) ? false : process.env.NODE_ENV === 'production',
  // Storage (S3-compatible or Cloudinary)
  s3: {
    bucket: process.env.S3_BUCKET ?? '',
    region: process.env.S3_REGION ?? '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    publicBase: process.env.S3_PUBLIC_BASE ?? '',
  },
  // Email
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'orders@havanat.ng',
  // Payments
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? '',
  flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY ?? '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:4000/api/auth/google/callback',
};
