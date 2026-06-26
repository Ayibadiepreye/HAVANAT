import 'dotenv/config';
import pg from 'pg';

const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

// Get the latest OTP for user 7
const r = await c.query(
  "SELECT id, user_id, purpose, expires_at, used_at, created_at, code_hash FROM two_factor_otps WHERE user_id = 7 ORDER BY id DESC LIMIT 3"
);

console.log('Recent OTPs for user 7:');
for (const row of r.rows) {
  console.log('  ', {
    id: row.id,
    purpose: row.purpose,
    expires_at: row.expires_at,
    used: row.used_at ? 'yes' : 'no',
    created: row.created_at,
    hash_prefix: row.code_hash.substring(0, 12) + '...',
  });
}
await c.end();
