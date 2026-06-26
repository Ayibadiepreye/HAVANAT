// scripts/add-security-lockouts.mjs
// Create security_lockouts table for rate-limiting auth-sensitive flows.
import pg from 'pg';
import 'dotenv/config';

const url = process.env.DATABASE_URL;
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();

await c.query(`
  CREATE TABLE IF NOT EXISTS security_lockouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(200),
    reason VARCHAR(64) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    window_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMP WITH TIME ZONE,
    locked_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );
`).then(() => process.stdout.write('✓ security_lockouts table created\n'))
  .catch(e => { console.error('table error:', e.message); process.exit(1); });

await c.query(`
  CREATE INDEX IF NOT EXISTS security_lockouts_user_reason_idx
  ON security_lockouts(user_id, reason);
`).then(() => process.stdout.write('✓ security_lockouts_user_reason_idx created\n'));

await c.query(`
  CREATE INDEX IF NOT EXISTS security_lockouts_email_reason_idx
  ON security_lockouts(email, reason);
`).then(() => process.stdout.write('✓ security_lockouts_email_reason_idx created\n'));

await c.query(`
  CREATE INDEX IF NOT EXISTS security_lockouts_active_idx
  ON security_lockouts(is_active);
`).then(() => process.stdout.write('✓ security_lockouts_active_idx created\n'));

await c.end();
process.stdout.write('Done.\n');