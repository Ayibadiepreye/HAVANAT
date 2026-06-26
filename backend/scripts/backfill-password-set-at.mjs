import pg from 'pg';
import 'dotenv/config';
const { Client } = pg;
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
// Backfill: every user that signed up via email (no google_id) had a real
// password set at creation. Their passwordSetAt was just never recorded
// because the column didn't exist yet.
const r = await c.query(`
  UPDATE users
  SET password_set_at = COALESCE(created_at, NOW())
  WHERE password_set_at IS NULL AND google_id IS NULL
  RETURNING id, email
`);
console.log(`Updated ${r.rowCount} email/password users:`);
for (const row of r.rows) {
  console.log(`  id=${row.id} email=${row.email}`);
}
await c.end();