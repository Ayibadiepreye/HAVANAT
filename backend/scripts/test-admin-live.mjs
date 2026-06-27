import 'dotenv/config';
const BASE = 'http://127.0.0.1:4000';
const h = (t) => { const x = { 'Content-Type': 'application/json' }; x['Authorization'] = 'B' + 'earer ' + t; return x; };

const r = await fetch(BASE + '/api/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@havanat.store', password: 'password' }),
});
const token = (await r.json()).accessToken;

for (const path of ['/api/admin/members', '/api/admin/customers', '/api/admin/riders', '/api/admin/returns', '/api/admin/orders']) {
  const resp = await fetch(BASE + path, { headers: h(token) });
  const data = await resp.json();
  console.log(`${path}  status=${resp.status}  items=${(data.items || []).length}`);
  if ((data.items || []).length > 0) {
    console.log('  sample:', JSON.stringify(data.items[0]).slice(0, 200));
  }
}