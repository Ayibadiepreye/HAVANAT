// Just a viewer: where do sneak peeks live in the DB?
import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const pad = (s, n) => String(s).padEnd(n);

console.log('═══════════════════════════════════════════════════════════════');
console.log('  WHERE SNEAK PEEKS LIVE IN THE DB');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('They are NOT a separate table. They are a FLAG on the');
console.log('existing products table:');
console.log('');

// Show columns of products relevant to sneak peek
const cols = await c.query(`
  SELECT column_name, data_type, column_default, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'products'
    AND column_name IN ('is_sneak_peek', 'sneak_peek_released_at', 'published', 'name', 'slug', 'price')
  ORDER BY column_name
`);
console.log('━━ products table columns ━━');
for (const r of cols.rows) {
  console.log(`  ${pad(r.column_name, 28)} ${pad(r.data_type, 20)} default=${r.column_default ?? 'none'}`);
}
console.log('');

// Show all products with sneak_peek status
const all = await c.query(`
  SELECT id, slug, name, is_sneak_peek, sneak_peek_released_at, published
  FROM products
  ORDER BY id
`);
const sneaks = all.rows.filter((r) => r.is_sneak_peek);
const normal = all.rows.filter((r) => !r.is_sneak_peek);
console.log('━━ All products (is_sneak_peek column) ━━');
console.log(`Total products:    ${all.rows.length}`);
console.log(`  Sneak peeks:     ${sneaks.length}`);
console.log(`  Regular:         ${normal.length}`);
console.log('');
console.log('Current sneak peeks:');
if (sneaks.length === 0) {
  console.log('  (none right now)');
} else {
  for (const p of sneaks) {
    const rel = p.sneak_peek_released_at ? new Date(p.sneak_peek_released_at).toISOString() : 'n/a';
    console.log(`  [${p.id}] ${pad(p.name, 30)} slug=${pad(p.slug, 25)} released=${rel}`);
  }
}
console.log('');

console.log('━━ How tier-gated visibility works ━━');
console.log('GET /api/products filters based on the caller\'s JWT tier:');
console.log('  - Standard users:  WHERE is_sneak_peek = false  (hidden)');
console.log('  - Deluxe/Elite:    no filter (visible)');
console.log('  - Anyone with ?sneakPeek=true: only sneak peeks; standard → 403');
console.log('');

console.log('━━ Who gets notified on release ━━');
const users = await c.query(`
  SELECT id, email, name, tier
  FROM users
  WHERE tier IN ('deluxe', 'elite')
  ORDER BY id
`);
console.log(`Currently ${users.rows.length} users would receive a sneak peek notification:`);
for (const u of users.rows) {
  console.log(`  [${u.id}] ${pad(u.email, 35)} ${u.name} (${u.tier})`);
}
console.log('');

console.log('━━ What gets written per release (false → true transition) ━━');
console.log('1. UPDATE products SET is_sneak_peek = true, sneak_peek_released_at = NOW()');
console.log('   WHERE id = $productId');
console.log('2. INSERT INTO notifications (category, title, body, channels, scope, ...)');
console.log('   for each deluxe/elite user:');
console.log('   - category: "membership"');
console.log('   - title: "Sneak Peek: {productName}"');
console.log('   - body: description');
console.log('   - scope: "user"  (targetUserId set)');
console.log('3. Send branded sneakPeekEmail to each via sendEmailSafe()');
console.log('4. INSERT INTO audit_log (action: "update", entityType: "product", ...)');
console.log('');

console.log('━━ Admin endpoints ━━');
console.log('POST /api/products/:id/sneak-peek');
console.log('  body: { enabled: true, releaseNote?: string }');
console.log('  auth: requireAuth + requireRole("admin", "moderator")');
console.log('  On false→true transition:');
console.log('    - flips the column');
console.log('    - inserts notifications');
console.log('    - sends emails');
console.log('  On true→false transition:');
console.log('    - just flips the column (no notifications)');
console.log('');

console.log('━━ Frontend admin entry points ━━');
console.log('1. /admin/products table → click the Sparkles button on a row');
console.log('   → prompts for release note → POSTs /api/products/:id/sneak-peek');
console.log('2. /admin/products → "Add Product" / "Edit Product" modal:');
console.log('   → Sneak Peek toggle in the modal sets is_sneak_peek + released_at');
console.log('');

await c.end();