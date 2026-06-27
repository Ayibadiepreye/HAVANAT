// Release "The Modernist Blazer" as a Sneak Peek and verify the full flow.
import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

const BASE = 'http://127.0.0.1:4000';
const h = (t) => ({ 'Content-Type': 'application/json', 'Authorization': 'B' + 'earer ' + t });

async function login(email) {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password' }),
  });
  return (await r.json()).accessToken;
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  RELEASING A SNEAK PEEK (full admin flow)');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

const adminToken = await login('admin@havanat.store');
const deluxeToken = await login('deluxe@havanat.store');
const standardToken = await login('standard@havanat.store');

// Pick a product
const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const products = await c.query("SELECT id, name, slug, is_sneak_peek FROM products ORDER BY id LIMIT 3");
console.log('Step 0: Pick a product to release as a sneak peek');
for (const p of products.rows) console.log(`  [${p.id}] ${p.name.padEnd(30)} is_sneak_peek=${p.is_sneak_peek}`);
const target = products.rows[1]; // The Charcoal Two-Piece or similar
console.log(`  → Will release: [${target.id}] ${target.name}`);
console.log('');

// Count notifications + deluxe/elite users before
const before = await c.query(`
  SELECT
    (SELECT COUNT(*)::int FROM notifications WHERE category = 'membership') AS member_notifs,
    (SELECT COUNT(*)::int FROM users WHERE tier IN ('deluxe', 'elite')) AS vip_users
`);
console.log(`Before release: ${before.rows[0].member_notifs} membership notifications, ${before.rows[0].vip_users} VIP users`);
console.log('');

// Step 1: Hit the admin endpoint (same as the Sparkles button in the UI)
console.log('Step 1: POST /api/products/:id/sneak-peek { enabled: true, releaseNote: "..." }');
const releaseNote = 'Limited drop — only 50 pieces, ships in 3 weeks';
const releaseRes = await fetch(`${BASE}/api/products/${target.id}/sneak-peek`, {
  method: 'POST',
  headers: h(adminToken),
  body: JSON.stringify({ enabled: true, releaseNote }),
});
const releaseBody = await releaseRes.json();
console.log(`  HTTP ${releaseRes.status}`);
console.log(`  Response: ${JSON.stringify(releaseBody).slice(0, 200)}`);
console.log('');

// Step 2: DB state after
const after = await c.query(`
  SELECT
    (SELECT is_sneak_peek FROM products WHERE id = $1) AS is_sneak,
    (SELECT sneak_peek_released_at FROM products WHERE id = $1) AS released_at,
    (SELECT COUNT(*)::int FROM notifications WHERE category = 'membership') AS member_notifs,
    (SELECT COUNT(*)::int FROM users WHERE tier IN ('deluxe', 'elite')) AS vip_users
`, [target.id]);
console.log('Step 2: DB state after release');
const a = after.rows[0];
console.log(`  products.is_sneak_peek = ${a.is_sneak}`);
console.log(`  products.sneak_peek_released_at = ${a.released_at}`);
console.log(`  notifications count (membership category) = ${a.member_notifs}`);
console.log(`  delta = ${a.member_notifs - before.rows[0].member_notifs} new notifications for VIP users`);
console.log('');

// Step 3: Who received notifications
const fanout = await c.query(`
  SELECT n.id, n.title, n.body, n.target_user_id, u.email, u.tier
  FROM notifications n
  JOIN users u ON u.id = n.target_user_id
  WHERE n.category = 'membership'
  ORDER BY n.id DESC
  LIMIT 5
`);
console.log('Step 3: Notifications fanned out (newest first):');
for (const n of fanout.rows) {
  console.log(`  [${n.id}] ${n.email.padEnd(35)} (${n.tier})`);
  console.log(`         title: ${n.title}`);
  console.log(`         body:  ${n.body.slice(0, 80)}...`);
}
console.log('');

// Step 4: Standard user cannot see the product now
const stdRes = await fetch(`${BASE}/api/products`, { headers: h(standardToken) });
const stdList = await stdRes.json();
const stdCanSee = (stdList.items ?? []).some((p) => p.id === target.id);
console.log(`Step 4: Standard user (login: standard@havanat.store) sees product ${target.id}? ${stdCanSee ? '❌ YES (BUG)' : '✅ NO (correct, hidden)'}`);

const stdSlugRes = await fetch(`${BASE}/api/products/${target.slug}`, { headers: h(standardToken) });
console.log(`Step 5: Standard user GET /api/products/${target.slug}: HTTP ${stdSlugRes.status} ${stdSlugRes.status === 403 ? '✅ 403 (correct)' : ''}`);
console.log('');

// Step 6: Deluxe user CAN see it
const dlxRes = await fetch(`${BASE}/api/products`, { headers: h(deluxeToken) });
const dlxList = await dlxRes.json();
const dlxCanSee = (dlxList.items ?? []).some((p) => p.id === target.id);
console.log(`Step 6: Deluxe user (deluxe@havanat.store) sees product ${target.id}? ${dlxCanSee ? '✅ YES (correct)' : '❌ NO (BUG)'}`);

const dlxSneakRes = await fetch(`${BASE}/api/products?sneakPeek=true`, { headers: h(deluxeToken) });
const dlxSneakList = await dlxSneakRes.json();
console.log(`Step 7: Deluxe ?sneakPeek=true returns ${(dlxSneakList.items ?? []).length} product(s)`);
for (const p of (dlxSneakList.items ?? [])) {
  console.log(`         [${p.id}] ${p.name} (isSneakPeek=${p.isSneakPeek})`);
}

await c.end();
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  DONE. Sneak peek is now live. Check the UI:');
console.log('   • Visit /sneak-peeks as deluxe@ → see the new product');
console.log('   • Visit /shop as deluxe@ → see SNEAK PEEK badge top-right');
console.log('   • Visit /shop as standard@ → never see it');
console.log('   • Check bell icon (Navbar) → notification appears');
console.log('═══════════════════════════════════════════════════════════════');