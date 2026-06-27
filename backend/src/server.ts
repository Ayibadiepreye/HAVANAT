import { config } from './config.js';
import app from './app.js';
import { startAutoPrune, stopAutoPrune } from './jobs/pruneNotifications.js';

// Auto-prune notifications older than the retention window (default 48h).
// Runs once at startup, then on a 6h interval. Safe to call before listen().
startAutoPrune();

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Havanat API listening on http://localhost:${config.port}  (env: ${config.nodeEnv})`);
});

const shutdown = (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, closing…`);
  stopAutoPrune();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
