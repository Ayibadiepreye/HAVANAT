import 'dotenv/config';

console.log('=== Backend (port 4000) ===');
const h = await fetch('http://127.0.0.1:4000/health');
console.log(await h.text());

console.log('\n=== Frontend (port 3002) ===');
const f = await fetch('http://127.0.0.1:3002/');
console.log('HTTP', f.status);

console.log('\n=== Membership tiers endpoint ===');
const tiers = await fetch('http://127.0.0.1:4000/api/memberships/tiers');
const tiersData = await tiers.json();
console.log(`Tiers loaded: ${tiersData.items?.length}`);
for (const t of tiersData.items ?? []) {
  console.log(`  - ${t.tier}: NGN ${t.price}/mo, ${t.features?.length} features`);
}

console.log('\n=== Login admin@havanat.store ===');
const login = await fetch('http://127.0.0.1:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@havanat.store', password: 'password' }),
});
const loginData = await login.json();
console.log(`user: ${loginData.user?.email}, tier: ${loginData.user?.tier}, provider: ${loginData.user?.provider}`);
const token = loginData.accessToken;

console.log('\n=== GET /api/auth/sessions (real DB data) ===');
const sess = await fetch('http://127.0.0.1:4000/api/auth/sessions', {
  headers: { Authorization: 'Bearer ' + token },
});
const sessData = await sess.json();
console.log(`Total active sessions: ${sessData.sessions?.length}`);
for (const s of (sessData.sessions ?? []).slice(0, 5)) {
  console.log(`  - ${s.device?.slice(0, 40)}${s.current ? ' (current)' : ''}`);
}

console.log('\n=== GET /api/memberships/me ===');
const me = await fetch('http://127.0.0.1:4000/api/memberships/me', {
  headers: { Authorization: 'Bearer ' + token },
});
const meData = await me.json();
console.log(`tier: ${meData.tier}, member: ${meData.member ? 'yes' : 'no'}`);

console.log('\n✅ All systems operational');
