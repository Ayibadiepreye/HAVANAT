// Test the rate limiter end-to-end via real HTTP requests
const BASE = 'http://127.0.0.1:4000';
const TEST_EMAIL = 'rate-test@havanat.store';

// Helper
async function call(path, body, method = 'POST') {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body),
  });
  let d;
  try { d = await r.json(); } catch { d = { error: 'invalid json' }; }
  return { status: r.status, body: d };
}

async function clearLockouts() {
  const pg = (await import('pg')).default;
  await import('dotenv/config');
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query("DELETE FROM security_lockouts WHERE email LIKE 'rate-%' OR email LIKE '%test%havanat%'");
  console.log('Cleared any test lockouts');
  await c.end();
}

console.log('=' .repeat(60));
console.log('RATE LIMIT TEST: forgot-password verify (email-based)');
console.log('=' .repeat(60));

await clearLockouts();

// First, send a forgot-password OTP so there's one in the DB
const sendResp = await call('/api/auth/forgot-password', { email: TEST_EMAIL });
console.log(`\nStep 0: Send OTP → ${JSON.stringify(sendResp.body)}`);

// Now try to verify with WRONG code 7 times — 5 should fail normally, then 6th and 7th should lock
console.log('\nAttempts to verify with WRONG code:');
for (let i = 1; i <= 7; i++) {
  const r = await call('/api/auth/forgot-password/verify', { email: TEST_EMAIL, code: '000000' });
  console.log(`  Attempt ${i}: status=${r.status} body=${JSON.stringify(r.body)}`);
}

console.log('\n' + '=' .repeat(60));
console.log('RATE LIMIT TEST: change-password (user-based, via JWT)');
console.log('=' .repeat(60));

// Login as admin to get a real token
const loginResp = await call('/api/auth/login', { email: 'admin@havanat.store', password: 'password' });
const token = loginResp.body.accessToken;
console.log(`\nStep 0: Login as admin → got token (user.id=${loginResp.body.user.id})`);

console.log('\nAttempts to change-password with WRONG current password:');
for (let i = 1; i <= 7; i++) {
  const r = await fetch(BASE + '/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify({ currentPassword: 'wrongpassword', newPassword: 'shouldntwork1' }),
  });
  let d;
  try { d = await r.json(); } catch { d = { error: 'invalid json' }; }
  console.log(`  Attempt ${i}: status=${r.status} body=${JSON.stringify(d)}`);
}

console.log('\nAll rate-limit tests complete.');
process.exit(0);