import 'dotenv/config';
import fs from 'node:fs';

const TOKEN = fs.readFileSync('/tmp/oauth-jwt.txt', 'utf8').trim();

console.log('Token length:', TOKEN.length);
console.log('Token prefix:', TOKEN.substring(0, 30));

console.log('\n=== Calling POST /api/auth/oauth/verify-email/send ===');
const r = await fetch('http://127.0.0.1:4000/api/auth/oauth/verify-email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + TOKEN,
  },
  body: JSON.stringify({}),
});
const d = await r.json().catch(() => ({}));
console.log('status:', r.status);
console.log('response:', JSON.stringify(d, null, 2));

if (r.status === 429) {
  console.log('\n⚠️ LOCKED — clear lockouts in DB:');
  console.log('node -e "import(\'pg\').then(async ({default: pg}) => { await import(\'dotenv/config\'); const c = new pg.Client({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); await c.connect(); await c.query(\'UPDATE security_lockouts SET is_active = false\'); await c.end(); })"');
}
