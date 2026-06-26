import pg from 'pg';
import 'dotenv/config';
const { Client } = pg;
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query("SELECT id, email, google_id IS NOT NULL as is_google, password_set_at FROM users WHERE email IN ('bonnieprincewill6@gmail.com','admin@havanat.store')");
for (const row of r.rows) {
  console.log(`id=${row.id} email=${row.email} isGoogle=${row.is_google} passwordSetAt=${row.password_set_at}`);
}
await c.end();