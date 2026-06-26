import 'dotenv/config';

// Login as admin
console.log('=== Login admin@havanat.store ===');
const loginRes = await fetch('http://127.0.0.1:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@havanat.store', password: 'password' }),
});
const login = await loginRes.json();
console.log('user:', login.user?.email);
console.log('access token len:', login.accessToken?.length);
const token = login.accessToken;

console.log('\n=== GET /api/auth/sessions (real backend data) ===');
const sessRes = await fetch('http://127.0.0.1:4000/api/auth/sessions', {
  headers: { Authorization: 'Bearer ' + token },
});
const sess = await sessRes.json();
console.log('status:', sessRes.status);
console.log('sessions:', JSON.stringify(sess, null, 2));

// Trigger another login to create a second session
console.log('\n=== Second login (creates a 2nd session) ===');
const login2 = await fetch('http://127.0.0.1:4000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'DifferentBrowser/1.0',  // simulate second device
  },
  body: JSON.stringify({ email: 'admin@havanat.store', password: 'password' }),
});
const login2Data = await login2.json();
console.log('user:', login2Data.user?.email);
const token2 = login2Data.accessToken;

console.log('\n=== GET /api/auth/sessions (should now have 2 sessions) ===');
const sess2 = await fetch('http://127.0.0.1:4000/api/auth/sessions', {
  headers: { Authorization: 'Bearer ' + token2 },
});
const sess2Data = await sess2.json();
console.log('sessions count:', sess2Data.sessions?.length);
console.log('sessions:', JSON.stringify(sess2Data.sessions, null, 2));

if (sess2Data.sessions?.length > 1) {
  console.log('\n=== Revoke all others (DELETE /api/auth/sessions) ===');
  const revRes = await fetch('http://127.0.0.1:4000/api/auth/sessions', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token2 },
  });
  const revData = await revRes.json();
  console.log('status:', revRes.status);
  console.log('response:', JSON.stringify(revData, null, 2));

  console.log('\n=== Verify only current session remains ===');
  const sess3 = await fetch('http://127.0.0.1:4000/api/auth/sessions', {
    headers: { Authorization: 'Bearer ' + token2 },
  });
  const sess3Data = await sess3.json();
  console.log('sessions after revoke:', sess3Data.sessions?.length);
  for (const s of (sess3Data.sessions ?? [])) {
    console.log('  ', { id: s.id, device: s.device?.slice(0, 40), current: s.current });
  }
}
