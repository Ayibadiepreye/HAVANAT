// Havanat — Full Test Data Seed
// Run with: npm run db:seed:test
// Creates complete test data including reviews, bespoke requests, orders, returns, etc.

import 'dotenv/config';
import { db, client } from './client.js';
import {
  users, addresses, products, orders, orderItems, reviews,
  deliveryZones, returns as returnsTable, bespokeRequests,
  riderProfiles, notifications, newsletterSubscribers,
  emailTemplates, members, memberships, membershipTiers,
  auditLog,
} from './schema.js';
import bcrypt from 'bcryptjs';
const { hash } = bcrypt;
import { sql } from 'drizzle-orm';

const SEED_PASSWORD = 'password';

async function clearTestData() {
  console.log('Clearing test data (keeping users, membership tiers, tier discounts)…');
  // Clear everything except users, membershipTiers, and user roles
  await db.execute(sql`
    TRUNCATE TABLE
      audit_log, bespoke_requests, reviews, returns, payouts, 
      order_items, orders, rider_profiles, addresses, products, 
      delivery_zones, notifications, newsletter_subscribers, 
      email_templates, memberships, members, refresh_tokens
    RESTART IDENTITY CASCADE
  `);
}

async function getExistingUsers() {
  console.log('Fetching existing users…');
  const allUsers = await db.select().from(users);
  
  const admin = allUsers.find(u => u.role === 'admin');
  const moderator = allUsers.find(u => u.role === 'moderator');
  const rider = allUsers.find(u => u.role === 'rider');
  const standard = allUsers.find(u => u.role === 'customer' && u.tier === 'standard');
  const deluxe = allUsers.find(u => u.role === 'customer' && u.tier === 'deluxe');
  const elite = allUsers.find(u => u.role === 'customer' && u.tier === 'elite');

  if (!admin || !moderator || !rider || !standard || !deluxe || !elite) {
    throw new Error('Missing required users. Please run npm run db:seed first.');
  }

  return { admin, moderator, rider, standard, deluxe, elite };
}

async function seedRiderProfile(riderId: number) {
  console.log('Seeding rider profile…');
  await db.insert(riderProfiles).values({
    userId: riderId,
    vehicleType: 'bike',
    plateNumber: 'KJA-482-QG',
    address: '24 Aba Road, Port Harcourt',
    idVerified: true,
    status: 'active',
  });
}

async function seedDeliveryZones() {
  console.log('Seeding delivery zones…');
  await db.insert(deliveryZones).values([
    { state: 'Rivers', fee: '2500', eta: '1-2 business days' },
    { state: 'Lagos', fee: '3000', eta: '2-3 business days' },
    { state: 'FCT (Abuja)', fee: '3500', eta: '2-3 business days' },
    { state: 'Oyo (Ibadan)', fee: '3500', eta: '2-3 business days' },
    { state: 'Kano', fee: '5000', eta: '4-5 business days' },
    { state: 'Anambra', fee: '4500', eta: '3-5 business days' },
    { state: 'Delta', fee: '3000', eta: '2-3 business days' },
    { state: 'Other States', fee: '5500', eta: '5-7 business days' },
  ]);
}

async function seedProducts() {
  console.log('Seeding products…');
  const productsData = [
    { name: 'The Midnight Tuxedo', slug: 'midnight-tuxedo', price: '380000', category: 'suits', stock: 8, lowStockThreshold: 5, deliveryFee: '2500', occasion: 'formal-event' },
    { name: 'The Charcoal Two-Piece', slug: 'charcoal-two-piece', price: '320000', originalPrice: '380000.00', category: 'suits', stock: 18, lowStockThreshold: 5, deliveryFee: '2500', occasion: 'corporate' },
    { name: 'The Navy Single-Breasted', slug: 'navy-single-breasted', price: '290000', category: 'suits', stock: 15, lowStockThreshold: 5, deliveryFee: '2500', occasion: 'corporate' },
    { name: 'The Pinstripe Statement', slug: 'pinstripe-statement', price: '340000', category: 'suits', stock: 3, lowStockThreshold: 5, deliveryFee: '2500', occasion: 'formal-event' },
    { name: 'The Modernist Blazer', slug: 'modernist-blazer', price: '180000', category: 'blazers', stock: 12, lowStockThreshold: 5, deliveryFee: '2000', occasion: 'corporate' },
    { name: 'The Linen Casual Blazer', slug: 'linen-casual-blazer', price: '150000', category: 'blazers', stock: 8, lowStockThreshold: 5, deliveryFee: '2000', occasion: 'social' },
    { name: 'The Pleated Trouser', slug: 'pleated-trouser', price: '95000', category: 'trousers', stock: 20, lowStockThreshold: 5, deliveryFee: '1500', occasion: 'corporate' },
    { name: 'The Slim-Fit Trouser', slug: 'slim-fit-trouser', price: '85000', category: 'trousers', stock: 15, lowStockThreshold: 5, deliveryFee: '1500', occasion: 'corporate' },
    { name: 'The Waistcoat', slug: 'waistcoat', price: '65000', category: 'vests', stock: 10, lowStockThreshold: 5, deliveryFee: '1500', occasion: 'formal-event' },
    { name: 'The Cashmere Overcoat', slug: 'cashmere-overcoat', price: '420000', category: 'outerwear', stock: 4, lowStockThreshold: 3, deliveryFee: '3000', occasion: 'corporate' },
    { name: 'The Trench Coat', slug: 'trench-coat', price: '280000', category: 'outerwear', stock: 8, lowStockThreshold: 5, deliveryFee: '3000', occasion: 'everyday' },
    { name: 'The Noir Evening Set', slug: 'noir-evening-set', price: '450000', category: 'suits', stock: 2, lowStockThreshold: 3, deliveryFee: '2500', occasion: 'formal-event', isSneakPeek: true },
  ];

  const inserted = await db.insert(products).values(productsData.map((p) => ({
    ...p,
    description: `${p.name} — hand-tailored in our Port Harcourt studio. Made to measure, hand-finished with Italian and British fabrics.`,
    details: { 
      material: 'Italian wool blend', 
      care: 'Dry clean only', 
      shipping: '2-5 business days', 
      sizeGuide: 'Standard tailored fit. Consult our size chart or book a fitting.' 
    },
    deluxeDiscount: '0.15',
    eliteDiscount: '0.20',
    images: [`/images/products/${p.slug}.jpg`],
    inStock: p.stock > 0,
    fit: 'Tailored',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Navy', 'Charcoal', 'Grey'],
    isSneakPeek: p.isSneakPeek || false,
  }))).returning();

  return inserted;
}

async function seedAddresses(u: any) {
  console.log('Seeding addresses…');
  const addressData = [
    { userId: u.standard.id, fullName: u.standard.name, phone: u.standard.phone || '+234 803 456 7890', street: '15 Trans Amadi Road, Flat 3B', city: 'Port Harcourt', state: 'Rivers', isDefault: true },
    { userId: u.deluxe.id, fullName: u.deluxe.name, phone: u.deluxe.phone || '+234 805 123 4567', street: '42 Ikoyi Crescent', city: 'Lagos', state: 'Lagos', isDefault: true },
    { userId: u.elite.id, fullName: u.elite.name, phone: u.elite.phone || '+234 706 555 8800', street: '8 Maitama Drive, Suite 12', city: 'Abuja', state: 'FCT (Abuja)', isDefault: true },
  ];

  const inserted = await db.insert(addresses).values(addressData).returning();
  return inserted;
}

async function seedOrders(u: any, prods: any[], addrs: any[]) {
  console.log('Seeding orders…');
  
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const ordersData = [
    {
      userId: u.standard.id,
      orderNumber: `HVN-${Date.now()}-1`,
      subtotal: '320000',
      deliveryFee: '2500',
      discount: '0',
      total: '322500',
      status: 'delivered',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      customerName: u.standard.name,
      customerEmail: u.standard.email,
      customerPhone: u.standard.phone || '+234 803 456 7890',
      shippingAddress: JSON.stringify(addrs[0]),
      createdAt: twoWeeksAgo,
    },
    {
      userId: u.deluxe.id,
      orderNumber: `HVN-${Date.now()}-2`,
      subtotal: '380000',
      deliveryFee: '3000',
      discount: '57000',
      total: '326000',
      status: 'in_transit',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      customerName: u.deluxe.name,
      customerEmail: u.deluxe.email,
      customerPhone: u.deluxe.phone || '+234 805 123 4567',
      shippingAddress: JSON.stringify(addrs[1]),
      createdAt: weekAgo,
    },
    {
      userId: u.elite.id,
      orderNumber: `HVN-${Date.now()}-3`,
      subtotal: '450000',
      deliveryFee: '3500',
      discount: '90000',
      total: '363500',
      status: 'processing',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      customerName: u.elite.name,
      customerEmail: u.elite.email,
      customerPhone: u.elite.phone || '+234 706 555 8800',
      shippingAddress: JSON.stringify(addrs[2]),
      createdAt: threeDaysAgo,
    },
  ];

  const insertedOrders = await db.insert(orders).values(ordersData as any).returning();

  // Order items
  await db.insert(orderItems).values([
    { orderId: insertedOrders[0].id, productId: prods[1].id, productName: prods[1].name, quantity: 1, unitPrice: prods[1].price, totalPrice: prods[1].price },
    { orderId: insertedOrders[1].id, productId: prods[0].id, productName: prods[0].name, quantity: 1, unitPrice: prods[0].price, totalPrice: '323000' },
    { orderId: insertedOrders[2].id, productId: prods[11].id, productName: prods[11].name, quantity: 1, unitPrice: prods[11].price, totalPrice: '360000' },
  ]);

  return insertedOrders;
}

async function seedReviews(u: any, prods: any[]) {
  console.log('Seeding reviews…');
  
  const reviewsData = [
    {
      userId: u.standard.id,
      productId: prods[1].id,
      rating: 5,
      reviewText: 'Exceptional quality and fit. The charcoal two-piece is exactly what I needed for the boardroom. Worth every naira.',
      userTier: 'standard',
      userName: u.standard.name,
      approved: true,
    },
    {
      userId: u.deluxe.id,
      productId: prods[0].id,
      rating: 5,
      reviewText: 'The midnight tuxedo exceeded all expectations. Impeccable tailoring and the fabric is absolutely premium. Received countless compliments at the gala.',
      userTier: 'deluxe',
      userName: u.deluxe.name,
      approved: true,
    },
    {
      userId: u.elite.id,
      productId: prods[4].id,
      rating: 4,
      reviewText: 'Great blazer for business meetings. Fits perfectly and the material breathes well in Lagos heat. Would recommend.',
      userTier: 'elite',
      userName: u.elite.name,
      approved: true,
    },
    {
      userId: u.standard.id,
      productId: prods[6].id,
      rating: 5,
      reviewText: 'These pleated trousers are a game changer. Perfect drape and the tailoring is spot on.',
      userTier: 'standard',
      userName: u.standard.name,
      approved: true,
    },
  ];

  await db.insert(reviews).values(reviewsData as any);
}

async function seedReturns(u: any, ordersList: any[]) {
  console.log('Seeding returns…');
  
  await db.insert(returnsTable).values([
    {
      returnNumber: `RET-${Date.now()}`,
      orderId: ordersList[0].id,
      userId: u.standard.id,
      reason: 'Size issue - jacket sleeves slightly long',
      status: 'approved',
      refundAmount: '322500',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ]);
}

async function seedBespokeRequests(u: any) {
  console.log('Seeding bespoke requests…');
  
  const bespokeData = [
    {
      reference: `BSP-${Date.now()}-1`,
      userId: u.deluxe.id,
      customerName: u.deluxe.name,
      customerEmail: u.deluxe.email,
      customerPhone: u.deluxe.phone || '+234 805 123 4567',
      occasion: 'Wedding ceremony - groomsman',
      timeline: '4-6 weeks',
      budget: '650000',
      description: 'Looking for a bespoke three-piece suit in midnight blue. Need it for my brother\'s wedding in December. Open to fabric recommendations.',
      measurements: {
        chest: '42"',
        waist: '34"',
        shoulders: '18"',
        sleeve: '25"',
        inseam: '32"',
      },
      status: 'in_review',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      reference: `BSP-${Date.now()}-2`,
      userId: u.elite.id,
      customerName: u.elite.name,
      customerEmail: u.elite.email,
      customerPhone: u.elite.phone || '+234 706 555 8800',
      occasion: 'Business travel - London trip',
      timeline: '2-3 weeks',
      budget: '700000',
      description: 'Need a cashmere overcoat for an upcoming business trip to London in winter. Prefer classic British styling with modern touches.',
      measurements: {
        chest: '44"',
        shoulders: '19"',
        sleeve: '26"',
        length: '48"',
      },
      status: 'new',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  await db.insert(bespokeRequests).values(bespokeData as any);
}

async function seedNotifications(u: any) {
  console.log('Seeding notifications…');
  
  const notificationsData = [
    {
      title: 'Order Delivered',
      body: 'Your order HVN-123 has been delivered successfully.',
      targetUserId: u.standard.id,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Order Shipped',
      body: 'Your order HVN-124 is on the way. Expected delivery in 2-3 days.',
      targetUserId: u.deluxe.id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'New Sneak Peek Available',
      body: 'A new exclusive collection is now available for Elite members.',
      targetUserId: u.elite.id,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  await db.insert(notifications).values(notificationsData as any);
}

async function seedNewsletterSubscribers() {
  console.log('Seeding newsletter subscribers…');
  
  await db.insert(newsletterSubscribers).values([
    { email: 'subscriber1@example.com', name: 'Amaka Johnson', subscribedAt: new Date() } as any,
    { email: 'subscriber2@example.com', name: 'Ibrahim Musa', subscribedAt: new Date() } as any,
  ]);
}

async function seedEmailTemplates() {
  console.log('Seeding email templates…');
  
  await db.insert(emailTemplates).values([
    { key: 'order_confirmation', subject: 'Your Havanat order is confirmed', body: 'Hi {{name}}, your order {{orderNumber}} is confirmed. Total: {{total}}. We will email you when it ships.' },
    { key: 'shipping_update', subject: 'Your order is on the way', body: 'Hi {{name}}, your order {{orderNumber}} is in transit. Track it here: {{trackingUrl}}' },
    { key: 'delivery_complete', subject: 'Your order has been delivered', body: 'Hi {{name}}, your order {{orderNumber}} has been delivered. Enjoy your new Havanat pieces!' },
    { key: 'return_approval', subject: 'Your return has been approved', body: 'Hi {{name}}, we have approved your return request for order {{orderNumber}}. A rider will be assigned for pickup.' },
    { key: 'delivery_otp', subject: 'Your Havanat delivery code', body: 'Your 4-digit delivery code is {{otp}}. Show this to the rider upon delivery.' },
    { key: 'bespoke_received', subject: 'We received your bespoke request', body: 'Hi {{name}}, we received your bespoke request. Our team will review it and get back to you within 2-3 business days.' },
  ]);
}

async function seedMemberships(u: any) {
  console.log('Seeding memberships…');
  
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Deluxe membership
  await db.insert(members).values({
    userId: u.deluxe.id,
    tier: 'deluxe',
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    notes: 'Test member - Deluxe tier',
  } as any);

  await db.insert(memberships).values({
    userId: u.deluxe.id,
    tier: 'Deluxe',
    cycle: 'monthly',
    status: 'active',
    amountPaid: '10000',
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
  } as any);

  // Elite membership
  await db.insert(members).values({
    userId: u.elite.id,
    tier: 'elite',
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    notes: 'Test member - Elite tier',
  } as any);

  await db.insert(memberships).values({
    userId: u.elite.id,
    tier: 'Elite',
    cycle: 'monthly',
    status: 'active',
    amountPaid: '25000',
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
  } as any);
}

async function seedAuditLog(u: any) {
  console.log('Seeding audit log…');
  
  await db.insert(auditLog).values([
    {
      userId: u.admin.id,
      userName: u.admin.name,
      userRole: 'admin',
      action: 'create',
      entityType: 'product',
      entityId: '1',
      entityLabel: 'The Midnight Tuxedo',
      summary: 'Created new product',
      changes: {},
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      userId: u.moderator.id,
      userName: u.moderator.name,
      userRole: 'moderator',
      action: 'update',
      entityType: 'order',
      entityId: '1',
      entityLabel: 'Order HVN-123',
      summary: 'Updated order status to shipped',
      changes: {},
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ] as any);
}

async function main() {
  try {
    await clearTestData();
    
    const u = await getExistingUsers();
    
    await seedRiderProfile(u.rider.id);
    await seedDeliveryZones();
    const prods = await seedProducts();
    const addrs = await seedAddresses(u);
    const ordersList = await seedOrders(u, prods, addrs);
    await seedReviews(u, prods);
    await seedReturns(u, ordersList);
    await seedBespokeRequests(u);
    await seedNotifications(u);
    await seedNewsletterSubscribers();
    await seedEmailTemplates();
    await seedMemberships(u);
    await seedAuditLog(u);
    
    console.log('\n✅ Full test data seed complete!\n');
    console.log('Seeded data:');
    console.log('  • 12 Products (1 sneak peek)');
    console.log('  • 8 Delivery zones');
    console.log('  • 3 Orders (delivered, in_transit, processing)');
    console.log('  • 4 Reviews');
    console.log('  • 1 Return request');
    console.log('  • 2 Bespoke requests (in_review, new)');
    console.log('  • 3 Notifications');
    console.log('  • 6 Email templates');
    console.log('  • 2 Active memberships (Deluxe, Elite)');
    console.log('  • 2 Audit log entries');
    console.log('  • 2 Newsletter subscribers\n');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
