// Seeder: populates the database with realistic mock data matching the frontend.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, pool } from './client.js';
import {
  users, products, homepage, lookbook, testimonials, banners, branding,
  deliveryZones, paymentGateways, emailTemplates, memberships, members,
  orders, orderItems, returns, riderProfiles, deliveries, payouts, auditLog,
} from './schema.js';

async function seed() {
  console.log('Seeding…');

  // Wipe in dependency order
  await db.delete(auditLog);
  await db.delete(payouts);
  await db.delete(deliveries);
  await db.delete(riderProfiles);
  await db.delete(returns);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(members);
  await db.delete(memberships);
  await db.delete(paymentGateways);
  await db.delete(deliveryZones);
  await db.delete(emailTemplates);
  await db.delete(banners);
  await db.delete(testimonials);
  await db.delete(lookbook);
  await db.delete(homepage);
  await db.delete(branding);
  await db.delete(products);
  await db.delete(users);

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  // Users
  const [admin, moderator, rider, standard, deluxe, elite] = await db.insert(users).values([
    { email: 'admin@havanat.com', passwordHash: hash('password'), name: 'Adaeze Nwosu', role: 'admin', phone: '+2348030000001' },
    { email: 'moderator@havanat.com', passwordHash: hash('password'), name: 'Folake Adetunji', role: 'moderator', phone: '+2348030000002' },
    { email: 'rider@havanat.com', passwordHash: hash('password'), name: 'Tunde Adewale', role: 'rider', phone: '+2348031110001' },
    { email: 'standard@havanat.com', passwordHash: hash('password'), name: 'Tunde Bakare', role: 'customer', tier: 'standard', phone: '+2348023180099' },
    { email: 'deluxe@havanat.com', passwordHash: hash('password'), name: 'Folake Adesanya', role: 'customer', tier: 'deluxe', phone: '+2347065558800' },
    { email: 'elite@havanat.com', passwordHash: hash('password'), name: 'Emmanuel Adeyemi', role: 'customer', tier: 'elite', phone: '+2348034567890' },
  ]).returning();

  // Products
  const productSeed = [
    { slug: 'black-suit', name: 'Black Suit', category: 'suits', price: '180000', images: ['/images/products/suit-double-breasted.jpg'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Black'], fit: 'tailored', inStock: true, featured: true, description: 'Classic black suit, fully lined.', details: 'Italian wool, half-canvas construction.', care: 'Dry clean only.', sku: 'HVN-0001' },
    { slug: 'navy-blazer', name: 'Navy Blazer', category: 'suits', price: '120000', images: ['/images/products/blazer-cropped.jpg'], sizes: ['M', 'L', 'XL'], colors: ['Navy'], fit: 'slim', inStock: true, featured: true, description: 'Tailored navy blazer.', details: 'Two-button single-breasted.', care: 'Dry clean only.', sku: 'HVN-0002' },
    { slug: 'pleated-trousers', name: 'Pleated Trousers', category: 'trousers', price: '65000', images: ['/images/products/trousers-pleated.jpg'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Charcoal'], fit: 'classic', inStock: true, featured: false, description: 'High-waist pleated trousers.', details: 'Wool blend.', care: 'Dry clean only.', sku: 'HVN-0003' },
    { slug: 'wool-overcoat', name: 'Wool Overcoat', category: 'outerwear', price: '220000', images: ['/images/products/overcoat-wool.jpg'], sizes: ['M', 'L', 'XL'], colors: ['Camel'], fit: 'oversized', inStock: true, featured: true, description: 'Warm wool overcoat.', details: '100% wool, satin lining.', care: 'Dry clean only.', sku: 'HVN-0004' },
    { slug: 'tuxedo-jacket', name: 'Tuxedo Jacket', category: 'suits', price: '240000', images: ['/images/products/tuxedo-jacket.jpg'], sizes: ['M', 'L'], colors: ['Black'], fit: 'slim', inStock: true, featured: true, description: 'Black-tie tuxedo jacket.', details: 'Satin peak lapels.', care: 'Dry clean only.', sku: 'HVN-0005' },
    { slug: 'tailored-vest', name: 'Tailored Vest', category: 'accessories', price: '45000', images: ['/images/products/vest-tailored.jpg'], sizes: ['S', 'M', 'L'], colors: ['Black', 'Grey'], fit: 'tailored', inStock: true, featured: false, description: 'Five-button waistcoat.', details: 'Adjustable back strap.', care: 'Dry clean only.', sku: 'HVN-0006' },
  ];
  const insertedProducts = await db.insert(products).values(productSeed).returning();

  // Homepage + branding + content
  await db.insert(homepage).values({
    heroImage: '/images/hero/main.jpg',
    heroHeadline: 'Where Style Meets Elegance',
    heroTagline: 'Nigerian fashion, made global.',
    featuredProductIds: insertedProducts.filter((p) => p.featured).map((p) => p.id),
  });
  await db.insert(branding).values({
    logoLight: '/logo-light.svg',
    logoDark: '/logo-dark.svg',
    favicon: '/favicon.ico',
  });
  await db.insert(lookbook).values([
    { imageUrl: '/images/lookbook/1.jpg', caption: 'Autumn Collection', order: 1 },
    { imageUrl: '/images/lookbook/2.jpg', caption: 'Tailored for You', order: 2 },
    { imageUrl: '/images/lookbook/3.jpg', caption: 'Modern Heritage', order: 3 },
  ]);
  await db.insert(testimonials).values([
    { name: 'Aisha Bello', rating: 5, text: 'The fit is impeccable. I have never felt more confident.' },
    { name: 'Chinedu Okeke', rating: 5, text: 'Outstanding craftsmanship. Worth every naira.' },
    { name: 'Kemi Adebayo', rating: 4, text: 'Beautiful pieces, fast delivery to Lagos.' },
  ]);
  await db.insert(banners).values([
    { image: '/images/banners/sale.jpg', title: 'End of Season Sale', link: '/shop?sale=1', active: true, startsAt: new Date(), endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  ]);

  // Memberships
  await db.insert(memberships).values([
    { tier: 'Standard', price: '5000', billingCycles: ['monthly', 'yearly'], features: [
      { label: 'Free standard delivery', included: true },
      { label: 'Early access to sales', included: true },
      { label: 'Personal styling', included: false },
      { label: 'Custom suits', included: false },
    ]},
    { tier: 'Deluxe', price: '15000', billingCycles: ['monthly', 'quarterly', 'yearly'], features: [
      { label: 'Free standard delivery', included: true },
      { label: 'Early access to sales', included: true },
      { label: 'Personal styling', included: true },
      { label: 'Custom suits', included: false },
    ]},
    { tier: 'Elite', price: '40000', billingCycles: ['monthly', 'quarterly', 'yearly'], features: [
      { label: 'Free express delivery', included: true },
      { label: 'Sneak peeks + private launches', included: true },
      { label: 'Personal styling', included: true },
      { label: 'Custom suits', included: true },
    ]},
  ]);

  // Delivery zones
  await db.insert(deliveryZones).values([
    { state: 'Lagos', fee: '1500', etaDays: 1 },
    { state: 'Abuja (FCT)', fee: '2500', etaDays: 2 },
    { state: 'Port Harcourt', fee: '3000', etaDays: 2 },
    { state: 'Ibadan', fee: '2500', etaDays: 2 },
    { state: 'Kano', fee: '4000', etaDays: 4 },
    { state: 'Enugu', fee: '3500', etaDays: 3 },
    { state: 'Benin City', fee: '3500', etaDays: 3 },
  ]);

  // Payment + email
  await db.insert(paymentGateways).values([
    { name: 'paystack', enabled: true, publicKey: 'pk_test_xxx', secretKey: 'sk_test_xxx' },
    { name: 'flutterwave', enabled: false },
    { name: 'stripe', enabled: false },
  ]);
  await db.insert(emailTemplates).values([
    { key: 'order_confirmation', subject: 'Order {{orderNumber}} confirmed', body: 'Hi {{name}}, your order has been received.' },
    { key: 'shipping_update', subject: 'Your order is on the way', body: 'Hi {{name}}, your order {{orderNumber}} has shipped.' },
    { key: 'return_approved', subject: 'Return request approved', body: 'Hi {{name}}, your return {{returnNumber}} has been approved.' },
  ]);

  // Rider profile
  const riderProfile = await db.insert(riderProfiles).values({
    userId: rider!.id,
    vehicleType: 'bike',
    plateNumber: 'LSR-123-AB',
    address: '24 Marina Road, Lagos',
    idVerified: true,
    status: 'active',
    rating: '4.85',
    totalDeliveries: 142,
    bankName: 'GTBank',
    accountNumber: '0123456789',
    accountName: 'Tunde Adewale',
  }).returning();

  // Memberships for customers
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await db.insert(members).values([
    { userId: standard!.id, tier: 'Standard', status: 'active', billingCycle: 'monthly', nextBillingDate: oneYearLater },
    { userId: deluxe!.id, tier: 'Deluxe', status: 'active', billingCycle: 'monthly', nextBillingDate: oneYearLater },
    { userId: elite!.id, tier: 'Elite', status: 'active', billingCycle: 'yearly', nextBillingDate: oneYearLater },
  ]);

  // A few sample orders
  const sampleOrders = await db.insert(orders).values([
    { orderNumber: 'ORD-2026-001', userId: standard!.id, status: 'shipped', subtotal: '180000', shippingFee: '1500', total: '181500', paymentMethod: 'paystack', paidAt: new Date(), customerName: 'Tunde Bakare', customerEmail: 'standard@havanat.com', customerPhone: '+2348023180099', tracking: [
      { status: 'processing', timestamp: new Date(Date.now() - 3 * 86400_000).toISOString() },
      { status: 'shipped', timestamp: new Date().toISOString(), note: 'Out for delivery' },
    ]},
    { orderNumber: 'ORD-2026-002', userId: deluxe!.id, status: 'delivered', subtotal: '120000', shippingFee: '0', total: '120000', paymentMethod: 'paystack', paidAt: new Date(Date.now() - 7 * 86400_000), customerName: 'Folake Adesanya', customerEmail: 'deluxe@havanat.com', customerPhone: '+2347065558800', tracking: [
      { status: 'processing', timestamp: new Date(Date.now() - 9 * 86400_000).toISOString() },
      { status: 'shipped', timestamp: new Date(Date.now() - 8 * 86400_000).toISOString() },
      { status: 'delivered', timestamp: new Date(Date.now() - 7 * 86400_000).toISOString() },
    ]},
    { orderNumber: 'ORD-2026-003', userId: elite!.id, status: 'processing', subtotal: '460000', shippingFee: '0', total: '460000', paymentMethod: 'paystack', paidAt: new Date(Date.now() - 1 * 86400_000), customerName: 'Emmanuel Adeyemi', customerEmail: 'elite@havanat.com', customerPhone: '+2348034567890', tracking: [
      { status: 'processing', timestamp: new Date(Date.now() - 1 * 86400_000).toISOString() },
    ]},
  ]).returning();
  await db.insert(orderItems).values([
    { orderId: sampleOrders[0]!.id, productId: insertedProducts[0]!.id, productName: 'Black Suit', productImage: insertedProducts[0]!.images[0], size: 'L', quantity: 1, unitPrice: '180000' },
    { orderId: sampleOrders[1]!.id, productId: insertedProducts[1]!.id, productName: 'Navy Blazer', productImage: insertedProducts[1]!.images[0], size: 'M', quantity: 1, unitPrice: '120000' },
    { orderId: sampleOrders[2]!.id, productId: insertedProducts[0]!.id, productName: 'Black Suit', productImage: insertedProducts[0]!.images[0], size: 'L', quantity: 1, unitPrice: '180000' },
    { orderId: sampleOrders[2]!.id, productId: insertedProducts[4]!.id, productName: 'Tuxedo Jacket', productImage: insertedProducts[4]!.images[0], size: 'L', quantity: 1, unitPrice: '240000' },
    { orderId: sampleOrders[2]!.id, productId: insertedProducts[3]!.id, productName: 'Wool Overcoat', productImage: insertedProducts[3]!.images[0], size: 'L', quantity: 1, unitPrice: '40000' },
  ]);

  // A few sample deliveries for the rider
  await db.insert(deliveries).values([
    { orderId: sampleOrders[0]!.id, riderId: rider!.id, type: 'delivery', status: 'in_transit', customerName: 'Tunde Bakare', customerPhone: '+2348023180099', address: '12 Awolowo Road, Ikoyi', city: 'Lagos', state: 'Lagos', itemSummary: 'Black Suit', itemCount: 1, deliveryFee: '1500', scheduledFor: new Date(), otp: '1234' },
    { orderId: sampleOrders[1]!.id, riderId: rider!.id, type: 'delivery', status: 'delivered', customerName: 'Folake Adesanya', customerPhone: '+2347065558800', address: '5 Gana Street, Maitama', city: 'Abuja', state: 'FCT', itemSummary: 'Navy Blazer', itemCount: 1, deliveryFee: '2500', scheduledFor: new Date(Date.now() - 7 * 86400_000), completedAt: new Date(Date.now() - 7 * 86400_000) },
  ]);

  // Sample audit log
  await db.insert(auditLog).values([
    { userId: admin!.id, userName: 'Adaeze Nwosu', userRole: 'admin', action: 'create', entityType: 'product', entityId: '1', entityLabel: 'Product: Black Suit', summary: 'Added product (suits)' },
    { userId: moderator!.id, userName: 'Folake Adetunji', userRole: 'moderator', action: 'update', entityType: 'homepage', entityId: '1', entityLabel: 'Homepage', summary: 'Updated hero headline' },
    { userId: admin!.id, userName: 'Adaeze Nwosu', userRole: 'admin', action: 'update', entityType: 'membership', entityId: 'Deluxe', entityLabel: 'Membership: Deluxe', summary: 'Updated Deluxe tier price' },
  ]);

  console.log('Seed complete.');
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  pool.end();
  process.exit(1);
});
