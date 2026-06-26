// scripts/add-purpose-column.mjs
// Add 'purpose' column to two_factor_otps and 'password_set_at' to users
import { Client } from 'pg';
import 'dotenv/config';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

console.log('Adding columns if missing...');

// Add purpose to two_factor_otps
await client.query(`
  ALTER TABLE two_factor_otps
  ADD COLUMN IF NOT EXISTS purpose VARCHAR(32) NOT NULL DEFAULT 'login';
`).then(() => console.log('✓ two_factor_otps.purpose added'))
  .catch(e => console.error('  error purpose:', e.message));

// Add index
await client.query(`
  CREATE INDEX IF NOT EXISTS two_factor_purpose_idx
  ON two_factor_otps(user_id, purpose);
`).then(() => console.log('✓ two_factor_purpose_idx created'))
  .catch(e => console.error('  error idx:', e.message));

// Add password_set_at to users
await client.query(`
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMP;
`).then(() => console.log('✓ users.password_set_at added'))
  .catch(e => console.error('  error password_set_at:', e.message));

await client.end();
console.log('Done.');