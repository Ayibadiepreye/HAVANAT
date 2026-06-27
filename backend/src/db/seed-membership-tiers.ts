import 'dotenv/config';
import { Client } from 'pg';

const TIERS = [
  {
    tier: 'Deluxe',
    displayName: 'Deluxe',
    price: '10000.00',
    billingCycles: ['monthly'],
    features: [
      'Free standard shipping on all orders',
      '15% off everything',
      'Early access to new collections (48h)',
      'Priority customer support',
    ],
    description: 'Style perks with savings and faster access.',
    sortOrder: 1,
    active: true,
  },
  {
    tier: 'Elite',
    displayName: 'Elite',
    price: '25000.00',
    billingCycles: ['monthly'],
    features: [
      'Free express shipping on all orders',
      '25% off everything',
      'Early access to new collections (1 week)',
      'Priority customer support (24/7)',
      'Complimentary bespoke alterations (1/quarter)',
      'Exclusive Elite-only drops',
    ],
    description: 'The full Havanat experience with VIP perks.',
    sortOrder: 2,
    active: true,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const t of TIERS) {
      await client.query(
        `INSERT INTO membership_tiers (tier, display_name, price, billing_cycles, features, description, sort_order, active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW(), NOW())
         ON CONFLICT (tier) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           price = EXCLUDED.price,
           billing_cycles = EXCLUDED.billing_cycles,
           features = EXCLUDED.features,
           description = EXCLUDED.description,
           sort_order = EXCLUDED.sort_order,
           active = EXCLUDED.active,
           updated_at = NOW()`,
        [t.tier, t.displayName, t.price, JSON.stringify(t.billingCycles), JSON.stringify(t.features), t.description, t.sortOrder, t.active]
      );
      console.log(`Upserted tier: ${t.tier} (${t.price} NGN/mo)`);
    }
    console.log('Done.');
  } finally {
    await client.end();
  }
}

main();
