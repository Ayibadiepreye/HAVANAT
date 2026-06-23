// Full Drizzle schema for Havanat. All tables. Use `npm run db:generate` to create migrations.
import { pgTable, serial, text, varchar, integer, decimal, boolean, timestamp, jsonb, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRole = pgEnum('user_role', ['customer', 'admin', 'moderator', 'rider']);
export const customerTier = pgEnum('customer_tier', ['standard', 'deluxe', 'elite']);
export const orderStatus = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
export const returnStatus = pgEnum('return_status', ['pending', 'approved', 'rider_scheduled', 'completed', 'rejected']);
export const deliveryStatus = pgEnum('delivery_status', ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed']);
export const deliveryType = pgEnum('delivery_type', ['delivery', 'pickup']);
export const riderStatus = pgEnum('rider_status', ['active', 'pending', 'suspended']);
export const vehicleType = pgEnum('vehicle_type', ['bike', 'car', 'van']);
export const tierName = pgEnum('tier_name', ['Standard', 'Deluxe', 'Elite']);
export const billingCycle = pgEnum('billing_cycle', ['monthly', 'quarterly', 'yearly']);
export const auditAction = pgEnum('audit_action', ['create', 'update', 'delete', 'revert']);
export const memberStatus = pgEnum('member_status', ['active', 'cancelled', 'paused']);

// ─── Users & Auth ──────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 200 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  avatar: text('avatar'),
  role: userRole('role').notNull().default('customer'),
  tier: customerTier('tier').default('standard'),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex('users_email_idx').on(t.email),
}));

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Catalog ───────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: varchar('sku', { length: 80 }),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description').notNull().default(''),
  details: text('details').notNull().default(''),
  care: text('care').notNull().default(''),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 12, scale: 2 }),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  sizes: jsonb('sizes').$type<string[]>().notNull().default([]),
  colors: jsonb('colors').$type<string[]>().notNull().default([]),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  category: varchar('category', { length: 80 }).notNull(),
  fit: varchar('fit', { length: 80 }),
  inStock: boolean('in_stock').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  categoryIdx: index('products_category_idx').on(t.category),
  inStockIdx: index('products_in_stock_idx').on(t.inStock),
}));

// ─── Cart & Orders ────────────────────────────────────────────────────
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  size: varchar('size', { length: 20 }),
  color: varchar('color', { length: 40 }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 50 }).notNull().default('Home'),
  street: varchar('street', { length: 200 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 80 }).notNull(),
  country: varchar('country', { length: 80 }).notNull().default('Nigeria'),
  postalCode: varchar('postal_code', { length: 20 }),
  phone: varchar('phone', { length: 30 }),
  isDefault: boolean('is_default').notNull().default(false),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 40 }).notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id),
  status: orderStatus('status').notNull().default('pending'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 40 }),
  paymentRef: varchar('payment_ref', { length: 200 }),
  paidAt: timestamp('paid_at'),
  addressId: integer('address_id').references(() => addresses.id),
  riderId: integer('rider_id').references(() => users.id),
  tracking: jsonb('tracking').$type<Array<{ status: string; timestamp: string; note?: string }>>().notNull().default([]),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  customerEmail: varchar('customer_email', { length: 200 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  statusIdx: index('orders_status_idx').on(t.status),
  userIdx: index('orders_user_idx').on(t.userId),
}));

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id),
  productName: varchar('product_name', { length: 200 }).notNull(),
  productImage: text('product_image'),
  size: varchar('size', { length: 20 }),
  color: varchar('color', { length: 40 }),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
});

// ─── Returns ──────────────────────────────────────────────────────────
export const returns = pgTable('returns', {
  id: serial('id').primaryKey(),
  returnNumber: varchar('return_number', { length: 40 }).notNull().unique(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  userId: integer('user_id').notNull().references(() => users.id),
  status: returnStatus('status').notNull().default('pending'),
  reason: varchar('reason', { length: 80 }).notNull(),
  description: text('description'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  riderId: integer('rider_id').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  refundedAt: timestamp('refunded_at'),
  refundAmount: decimal('refund_amount', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Riders & Deliveries ─────────────────────────────────────────────
export const riderProfiles = pgTable('rider_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  vehicleType: vehicleType('vehicle_type').notNull(),
  plateNumber: varchar('plate_number', { length: 30 }).notNull(),
  address: text('address'),
  idVerified: boolean('id_verified').notNull().default(false),
  status: riderStatus('status').notNull().default('pending'),
  rating: decimal('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  totalDeliveries: integer('total_deliveries').notNull().default(0),
  bankName: varchar('bank_name', { length: 80 }),
  accountNumber: varchar('account_number', { length: 20 }),
  accountName: varchar('account_name', { length: 120 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  returnId: integer('return_id').references(() => returns.id),
  riderId: integer('rider_id').references(() => users.id),
  type: deliveryType('type').notNull(),
  status: deliveryStatus('status').notNull().default('assigned'),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 80 }),
  itemSummary: text('item_summary'),
  itemCount: integer('item_count').notNull().default(1),
  deliveryFee: decimal('delivery_fee', { precision: 12, scale: 2 }).notNull().default('0'),
  scheduledFor: timestamp('scheduled_for').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  proofPhotoUrl: text('proof_photo_url'),
  proofSignatureUrl: text('proof_signature_url'),
  otp: varchar('otp', { length: 6 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  riderIdx: index('deliveries_rider_idx').on(t.riderId),
  statusIdx: index('deliveries_status_idx').on(t.status),
}));

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  riderId: integer('rider_id').notNull().references(() => users.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  reference: varchar('reference', { length: 100 }),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  paidAt: timestamp('paid_at'),
});

// ─── Memberships ─────────────────────────────────────────────────────
export const memberships = pgTable('memberships', {
  id: serial('id').primaryKey(),
  tier: tierName('tier').notNull().unique(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  billingCycles: jsonb('billing_cycles').$type<string[]>().notNull().default(['monthly']),
  features: jsonb('features').$type<Array<{ label: string; included: boolean }>>().notNull().default([]),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tier: tierName('tier').notNull(),
  status: memberStatus('status').notNull().default('active'),
  billingCycle: billingCycle('billing_cycle').notNull().default('monthly'),
  nextBillingDate: timestamp('next_billing_date').notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at'),
});

// ─── Content (CMS) ──────────────────────────────────────────────────
export const homepage = pgTable('homepage', {
  id: serial('id').primaryKey(),
  heroImage: text('hero_image'),
  heroHeadline: varchar('hero_headline', { length: 200 }),
  heroTagline: text('hero_tagline'),
  featuredProductIds: jsonb('featured_product_ids').$type<number[]>().notNull().default([]),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lookbook = pgTable('lookbook', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  caption: varchar('caption', { length: 200 }),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  avatar: text('avatar'),
  rating: integer('rating').notNull().default(5),
  text: text('text').notNull(),
  approved: boolean('approved').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  image: text('image').notNull(),
  title: varchar('title', { length: 200 }),
  link: text('link'),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const branding = pgTable('branding', {
  id: serial('id').primaryKey(),
  logoLight: text('logo_light'),
  logoDark: text('logo_dark'),
  favicon: text('favicon'),
  primaryColor: varchar('primary_color', { length: 20 }).notNull().default('#000000'),
  accentColor: varchar('accent_color', { length: 20 }).notNull().default('#16a34a'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Delivery zones, payment gateways, email templates ────────────
export const deliveryZones = pgTable('delivery_zones', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 80 }).notNull().unique(),
  fee: decimal('fee', { precision: 12, scale: 2 }).notNull(),
  etaDays: integer('eta_days').notNull(),
});

export const paymentGateways = pgTable('payment_gateways', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 40 }).notNull().unique(),
  enabled: boolean('enabled').notNull().default(false),
  publicKey: text('public_key'),
  secretKey: text('secret_key'),
});

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 80 }).notNull().unique(),
  subject: varchar('subject', { length: 200 }).notNull(),
  body: text('body').notNull(),
});

// ─── Audit log ─────────────────────────────────────────────────────
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  userId: integer('user_id').notNull(),
  userName: varchar('user_name', { length: 200 }).notNull(),
  userRole: userRole('user_role').notNull(),
  action: auditAction('action').notNull(),
  entityType: varchar('entity_type', { length: 80 }).notNull(),
  entityId: varchar('entity_id', { length: 80 }).notNull(),
  entityLabel: varchar('entity_label', { length: 300 }),
  summary: text('summary'),
  before: jsonb('before'),
  after: jsonb('after'),
}, (t) => ({
  entityIdx: index('audit_log_entity_idx').on(t.entityType, t.entityId),
  userIdx: index('audit_log_user_idx').on(t.userId),
  tsIdx: index('audit_log_ts_idx').on(t.timestamp),
}));

// ─── Relations ──────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many, one }) => ({
  orders: many(orders),
  cartItems: many(cartItems),
  addresses: many(addresses),
  refreshTokens: many(refreshTokens),
  riderProfile: one(riderProfiles, { fields: [users.id], references: [riderProfiles.userId] }),
  member: one(members, { fields: [users.id], references: [members.userId] }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  cartItems: many(cartItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  address: one(addresses, { fields: [orders.addressId], references: [addresses.id] }),
  items: many(orderItems),
  returns: many(returns),
  rider: one(users, { fields: [orders.riderId], references: [users.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  order: one(orders, { fields: [returns.orderId], references: [orders.id] }),
  user: one(users, { fields: [returns.userId], references: [users.id] }),
  rider: one(users, { fields: [returns.riderId], references: [users.id] }),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, { fields: [deliveries.orderId], references: [orders.id] }),
  return: one(returns, { fields: [deliveries.returnId], references: [returns.id] }),
  rider: one(users, { fields: [deliveries.riderId], references: [users.id] }),
}));
