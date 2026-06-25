import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';
import { returnsRouter } from './routes/returns.js';
import { ridersRouter } from './routes/riders.js';
import { auditRouter } from './routes/audit.js';
import { contentRouter } from './routes/content.js';
import { addressesRouter } from './routes/addresses.js';
import { staffRouter } from './routes/staff.js';
import { discountsRouter } from './routes/discounts.js';
import { bespokeRouter } from './routes/bespoke.js';
import { contactRouter } from './routes/contact.js';
import { authExtendedRouter } from './routes/auth-extended.js';
import { paymentsRouter } from './routes/payments.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));

const limiter = rateLimit({ windowMs: config.rateLimitWindowMs, max: config.rateLimitMax, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

app.get('/health', (_req, res) => res.json({ ok: true, env: config.nodeEnv, time: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/riders', ridersRouter);
app.use('/api/audit', auditRouter);
app.use('/api/content', contentRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/staff', staffRouter);
app.use('/api/discounts', discountsRouter);
app.use('/api/bespoke', bespokeRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authExtendedRouter); // for forgot-password, 2fa, verify-email — extends /api/auth
app.use('/api/payments', paymentsRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
