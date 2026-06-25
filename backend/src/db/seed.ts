// Havanat — Database seed
// Run with: npm run db:seed
// Creates the 6 mock accounts + a baseline set of products, delivery zones,
// and sample orders. Idempotent: drops + recreates on each run.

import 'dotenv/config';
import { db, client } from './client.js';
import {
  users, addresses, products,
  deliveryZones, returns,
  riderProfiles, notifications, newsletterSubscribers,
  emailTemplates, memberships,
} from './schema.js';
import bcrypt from 'bcryptjs';
const { hash } = bcrypt;
import { sql } from 'drizzle-orm';

const SEED_PASSWORD = 'password'; // All 6 mock accounts share this for testing.

async function clear() {
  console.log('Clearing existing data…');
  // Order matters due to FKs
  await db.execute(sql`TRUNCATE TABLE
    audit_log, returns, payouts, order_items, orders,
    rider_profiles, addresses, products, delivery_zones,
    notifications, newsletter_subscribers, email_templates,
    memberships, members, refresh_tokens, users
    RESTART IDENTITY CASCADE`);
}

async function seedUsers() {
  console.log('Seeding users…');
  const hashed = await hash(SEED_PASSWORD, 10);
  const [admin, moderator, rider, standard, deluxe, elite] = await db.insert(users).values([
    { email: 'admin@havanat.store', passwordHash: hashed, name: 'Adaeze Nwosu', role: 'admin', tier: 'standard', phone: '+234 803 000 0000', emailVerified: true },
    { email: 'moderator@havanat.store', passwordHash: hashed, name: 'Folake Adetunji', role: 'moderator', tier: 'standard', phone: '+234 803 000 0001', emailVerified: true },
    { email: 'rider@havanat.store', passwordHash: hashed, name: 'Tunde Adewale', role: 'rider', tier: 'standard', phone: '+234 803 111 0001', emailVerified: true },
    { email: 'standard@havanat.store', passwordHash: hashed, name: 'Tunde Bakare', role: 'customer', tier: 'standard', phone: '+234 803 456 7890', emailVerified: true },
    { email: 'deluxe@havanat.store', passwordHash: hashed, name: 'Chinedu Okafor', role: 'customer', tier: 'deluxe', phone: '+234 805 123 4567', emailVerified: true },
    { email: 'elite@havanat.store', passwordHash: hashed, name: 'Folake Adesanya', role: 'customer', tier: 'elite', phone: '+234 706 555 8800', emailVerified: true },
  ]).returning();
  return { admin, moderator, rider, standard, deluxe, elite };
}

async function seedRiderProfiles(rider: { id: number }) {
  console.log('Seeding rider profile…');
  await db.insert(riderProfiles).values({
    userId: rider.id, vehicleType: 'bike', plateNumber: 'KJA-482-QG', address: '24 Aba Road, Port Harcourt', idVerified: true, status: 'active',
  });
}

async function seedDeliveryZones() {
  console.log('Seeding delivery zones…');
  await db.insert(deliveryZones).values([
    { state: 'Rivers',     fee: '2500', eta: '1-2 business days' },
    { state: 'Lagos',      fee: '3000', eta: '2-3 business days' },
    { state: 'FCT',        fee: '3500', eta: '2-3 business days' },
    { state: 'Oyo',        fee: '3500', eta: '2-3 business days' },
    { state: 'Kano',       fee: '5000', eta: '4-5 business days' },
    { state: 'Anambra',    fee: '4500', eta: '3-5 business days' },
    { state: 'Other',      fee: '5500', eta: '5-7 business days' },
  ]);
}


async function seedProducts() {
  console.log('Seeding products…');
  const productsToInsert = [
    { name: 'The Midnight Tuxedo', slug: 'midnight-tuxedo', price: '380000', category: 'suits', stock: 8, lowStockThreshold: 5, deliveryFee: '2500', occasion: 'formal-event' },
    { name: 'The Charcoal Two-Piece', slug: 'charcoal-two-piece', price: '320000', originalPrice: '380000.00', category: 'suits', stock: 18, lowStockThreshold: 5, deliveryFee: '2500', occasion: 'corporate' },
    { name: 'The Navy Single-Breasted', slug: 'navy-single-breasted', price: '290000', category: 'suits', stock: 4, lowStockThreshold: 5, deliveryFee: '2500', occasion: 'corporate' },
    { name: 'The Pinstripe Statement', slug: 'pinstripe-statement', price: '340000', category: 'suits', stock: 0, lowStockThreshold: 5, deliveryFee: '2500', occasion: 'formal-event' },
    { name: 'The Modernist Blazer', slug: 'modernist-blazer', price: '180000', category: 'blazers', stock: 12, lowStockThreshold: 5, deliveryFee: '2000', occasion: 'corporate' },
    { name: 'The Linen Casual Blazer', slug: 'linen-casual-blazer', price: '150000', category: 'blazers', stock: 8, lowStockThreshold: 5, deliveryFee: '2000', occasion: 'social' },
    { name: 'The Pleated Trouser', slug: 'pleated-trouser', price: '95000', category: 'trousers', stock: 18, lowStockThreshold: 5, deliveryFee: '1500', occasion: 'corporate' },
    { name: 'The Slim-Fit Trouser', slug: 'slim-fit-trouser', price: '85000', category: 'trousers', stock: 4, lowStockThreshold: 5, deliveryFee: '1500', occasion: 'corporate' },
    { name: 'The Waistcoat', slug: 'waistcoat', price: '65000', category: 'vests', stock: 0, lowStockThreshold: 5, deliveryFee: '1500', occasion: 'formal-event' },
    { name: 'The Cashmere Overcoat', slug: 'cashmere-overcoat', price: '420000', category: 'outerwear', stock: 4, lowStockThreshold: 3, deliveryFee: '3000', occasion: 'corporate' },
    { name: 'The Trench Coat', slug: 'trench-coat', price: '280000', category: 'outerwear', stock: 8, lowStockThreshold: 5, deliveryFee: '3000', occasion: 'everyday' },
    { name: 'The Noir Evening Set', slug: 'noir-evening-set', price: '450000', category: 'suits', stock: 2, lowStockThreshold: 3, deliveryFee: '2500', occasion: 'formal-event' },
  ];
  const inserted = await db.insert(products).values(productsToInsert.map((p) => ({
    ...p,
    description: `${p.name} — hand-tailored in our studio. Made to measure, hand-finished.`,
    details: { material: 'Italian wool', care: 'Dry clean only', shipping: '2-5 days', sizeGuide: 'Standard fit. See size chart.' },
    deluxeDiscount: '0.05', eliteDiscount: '0.10',
    images: [`/images/products/${p.slug}.jpg`],
    inStock: p.stock > 0,
    fit: 'Tailored', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Black', 'Navy', 'Charcoal'],
  }))).returning();
  return inserted;
}

async function seedOrdersAndAddresses() {
  console.log('Skipping sample orders in seed (data layer out of scope for this cutover)…');
}

async function seedEmailTemplates() {
  console.log('Seeding email templates…');
  await db.insert(emailTemplates).values([
    { key: 'order_confirmation', subject: 'Your Havanat order is confirmed', body: 'Hi {{name}}, your order {{orderNumber}} is confirmed. We will email you when it ships.' },
    { key: 'shipping_update', subject: 'Your order is on the way', body: 'Hi {{name}}, your order {{orderNumber}} is in transit.' },
    { key: 'return_approval', subject: 'Your return has been approved', body: 'We have approved your return request. A rider will be assigned for pickup.' },
    { key: 'delivery_otp', subject: 'Your Havanat delivery code', body: 'Your 4-digit delivery code is {{otp}}. Show this to the rider.' },
  ]);
}

async function main() {
  try {
    await clear();
    const u = await seedUsers();
    await seedRiderProfiles(u.rider);
    await seedDeliveryZones();
    await seedProducts();
    await seedOrdersAndAddresses([u.standard, u.deluxe, u.elite]);
    await seedEmailTemplates();
    console.log('\n✅ Seed complete.\n');
    console.log('Mock accounts (all with password: "password"):');
    console.log('  admin@havanat.store       (admin)');
    console.log('  moderator@havanat.store   (moderator)');
    console.log('  rider@havanat.store       (rider)');
    console.log('  standard@havanat.store    (Standard tier)');
    console.log('  deluxe@havanat.store      (Deluxe tier)');
    console.log('  elite@havanat.store       (Elite tier)');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();