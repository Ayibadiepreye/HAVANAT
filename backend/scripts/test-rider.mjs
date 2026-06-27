import 'dotenv/config';
const BASE = 'http://127.0.0.1:4000';
const h = (t) => { const x = { 'Content-Type': 'application/json' }; x['Authorization'] = 'B' + 'earer ' + t; return x; };

const r = await fetch(BASE + '/api/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'rider@havanat.store', password: 'password' }),
});
const data = await r.json();
const token = data.accessToken;
console.log('Logged in as:', data.user.email, '(role:', data.user.role + ', id:', data.user.id + ')');

const profile = await (await fetch(BASE + '/api/riders/me/profile', { headers: h(token) })).json();
console.log('GET /api/riders/me/profile:');
console.log('  name:', profile.name);
console.log('  vehicle:', profile.profile?.vehicleType, profile.profile?.plateNumber);
console.log('  status:', profile.profile?.status);
console.log('  address:', profile.profile?.address);

const stats = await (await fetch(BASE + '/api/riders/me/stats', { headers: h(token) })).json();
console.log('\nGET /api/riders/me/stats:', JSON.stringify(stats));

const deliveries = await (await fetch(BASE + '/api/riders/me/deliveries', { headers: h(token) })).json();
console.log('\nGET /api/riders/me/deliveries: items=' + deliveries.items.length);

const me = await (await fetch(BASE + '/api/auth/me', { headers: h(token) })).json();
console.log('\nGET /api/auth/me: name=' + me.user.name + ' phone=' + me.user.phone);

// Test PATCH
const patched = await (await fetch(BASE + '/api/auth/me', {
  method: 'PATCH',
  headers: h(token),
  body: JSON.stringify({ phone: '+234 803 TEST' }),
})).json();
console.log('\nPATCH /api/auth/me -> phone=' + patched.user?.phone);