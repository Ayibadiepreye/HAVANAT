// scripts/read-otp.mjs
// Read the most recent unused OTP from two_factor_otps for a given email + purpose
import { Client } from 'pg';
import 'dotenv/config';
import crypto from 'node:crypto';

const url = process.env.DATABASE_URL;
const email = process.argv[2];
const purpose = process.argv[3] || 'forgot_password';

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

// Read all unused, non-expired OTPs for this user + purpose
const rows = (await client.query(`
  SELECT t.code_hash, t.expires_at
  FROM two_factor_otps t
  JOIN users u ON u.id = t.user_id
  WHERE u.email = $1 AND t.purpose = $2 AND t.used_at IS NULL AND t.expires_at > NOW()
  ORDER BY t.created_at DESC
  LIMIT 5
`, [email, purpose])).rows;

// Brute-force the 6-digit OTP (1M attempts max — fast)
const candidates = [];
for (let i = 0; i < 1000000; i++) {
  const code = String(i).padStart(6, '0');
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  if (rows.some(r => r.code_hash === hash)) {
    candidates.push(code);
  }
}
process.stdout.write(JSON.stringify(candidates));
await client.end();