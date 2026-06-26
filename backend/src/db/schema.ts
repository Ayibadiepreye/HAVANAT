// Havanat — full Drizzle schema. All 21 tables.
//
// Run `npm run db:generate` to produce a migration, then `npm run db:migrate` to apply.
// Run `npm run db:seed` to populate baseline data.

import {
  pgTable, serial, text, varchar, integer, decimal, boolean, timestamp,
  jsonb, pgEnum, uniqueIndex, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─────────────────────────── Enums ───────────────────────────

export const userRole = pgEnum('user_role', ['customer', 'admin', 'moderator', 'rider']);
export const customerTier = pgEnum('customer_tier', ['standard', 'deluxe', 'elite']);
export const orderStatus = pgEnum('order_status', ['received', 'processing', 'in_transit', 'delivered', 'cancelled']);
export const returnStatus = pgEnum('return_status', ['pending', 'approved', 'rider_scheduled', 'completed', 'rejected']);
export const deliveryStatus = pgEnum('delivery_status', ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed']);
export const deliveryType = pgEnum('delivery_type', ['delivery', 'pickup']);
export const riderStatus = pgEnum('rider_status', ['active', 'pending', 'suspended']);
export const vehicleType = pgEnum('vehicle_type', ['bike', 'car', 'van']);
export const tierName = pgEnum('tier_name', ['Standard', 'Deluxe', 'Elite']);
export const billingCycle = pgEnum('billing_cycle', ['monthly', 'quarterly', 'yearly']);
export const memberStatus = pgEnum('member_status', ['active', 'cancelled', 'paused']);

// ─────────────────────────── Users & Auth ───────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 200 }).notNull().unique(),
  passwordHash: text('password_hash'),
  // Timestamp when user last set their own password (via signup, change-password,
  // or reset-password). NULL means they have the random placeholder hash from
  // OAuth signup and have never set a real password.
  passwordSetAt: timestamp('password_set_at'),
  googleId: varchar('google_id', { length: 200 }),
  name: varchar('name', { length: 200 }).notNull(),
  role: userRole('role').notNull().default('customer'),
  tier: customerTier('tier').notNull().default('standard'),
  phone: varchar('phone', { length: 30 }),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').notNull().default(false),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  twoFactorSecret: text('two_factor_secret'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex('users_email_idx').on(t.email),
  googleIdx: index('users_google_idx').on(t.googleId),
}));

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  userAgent: text('user_agent'),
  ip: varchar('ip', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tokenIdx: uniqueIndex('refresh_tokens_token_idx').on(t.tokenHash),
  userIdx: index('refresh_tokens_user_idx').on(t.userId),
}));

export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 60 }).notNull().default('Home'),
  fullName: varchar('full_name', { length: 200 }).notNull(),
  phone: varchar('phone', { length: 30 }).notNull(),
  street: text('street').notNull(),
  city: varchar('city', { length: 120 }).notNull(),
  state: varchar('state', { length: 120 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('addresses_user_idx').on(t.userId),
}));

// ─────────────────────────── Products & Catalog ───────────────────────────

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  description: text('description').notNull().default(''),
  details: jsonb('details').$type<{ material?: string; care?: string; shipping?: string; sizeGuide?: string }>().notNull().default({}),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 12, scale: 2 }),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  category: varchar('category', { length: 60 }).notNull().default('suits'),
  sizes: jsonb('sizes').$type<string[]>().notNull().default([]),
  colors: jsonb('colors').$type<string[]>().notNull().default([]),
  fit: varchar('fit', { length: 60 }).notNull().default('Tailored'),
  occasion: varchar('occasion', { length: 60 }),
  stock: integer('stock').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  deliveryFee: decimal('delivery_fee', { precision: 12, scale: 2 }).notNull().default('2500'),
  deluxeDiscount: decimal('deluxe_discount', { precision: 5, scale: 4 }).notNull().default('0.05'),
  eliteDiscount: decimal('elite_discount', { precision: 5, scale: 4 }).notNull().default('0.10'),
  inStock: boolean('in_stock').notNull().default(true),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex('products_slug_idx').on(t.slug),
  categoryIdx: index('products_category_idx').on(t.category),
  occasionIdx: index('products_occasion_idx').on(t.occasion),
}));

// ─────────────────────────── Logistics ───────────────────────────

export const deliveryZones = pgTable('delivery_zones', {
  id: serial('id').primaryKey(),
  state: varchar('state', { length: 120 }).notNull().unique(),
  fee: decimal('fee', { precision: 12, scale: 2 }).notNull(),
  eta: varchar('eta', { length: 60 }).notNull().default('3-5 business days'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const riderProfiles = pgTable('rider_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  vehicleType: vehicleType('vehicle_type').notNull().default('bike'),
  plateNumber: varchar('plate_number', { length: 30 }).notNull(),
  address: text('address'),
  idVerified: boolean('id_verified').notNull().default(false),
  status: riderStatus('status').notNull().default('pending'),
  bankName: varchar('bank_name', { length: 120 }),
  accountNumber: varchar('account_number', { length: 30 }),
  accountName: varchar('account_name', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  riderId: integer('rider_id').references(() => users.id, { onDelete: 'set null' }),
  type: deliveryType('type').notNull().default('delivery'),
  status: deliveryStatus('status').notNull().default('assigned'),
  deliveryOtp: varchar('delivery_otp', { length: 6 }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  pickedUpAt: timestamp('picked_up_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  proofOfDeliveryUrl: text('proof_of_delivery_url'),
  proofPhotoUrl: text('proof_photo_url'),
  proofSignatureUrl: text('proof_signature_url'),
  notes: text('notes'),
}, (t) => ({
  orderIdx: index('deliveries_order_idx').on(t.orderId),
  riderIdx: index('deliveries_rider_idx').on(t.riderId),
}));

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  riderId: integer('rider_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  reference: text('reference'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  riderIdx: index('payouts_rider_idx').on(t.riderId),
}));

// ─────────────────────────── Orders ───────────────────────────

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 30 }).notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  status: orderStatus('status').notNull().default('received'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 30 }).notNull().default('paystack'),
  paymentReference: varchar('payment_reference', { length: 200 }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  riderId: integer('rider_id').references(() => users.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  customerEmail: varchar('customer_email', { length: 200 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }),
  shippingAddress: jsonb('shipping_address').$type<{ fullName: string; phone: string; street: string; city: string; state: string; }>().notNull(),
  tracking: jsonb('tracking').$type<Array<{ status: string; timestamp: string; note?: string }>>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('orders_user_idx').on(t.userId),
  statusIdx: index('orders_status_idx').on(t.status),
  numberIdx: uniqueIndex('orders_number_idx').on(t.orderNumber),
}));

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  productName: varchar('product_name', { length: 200 }).notNull(),
  productImage: text('product_image'),
  size: varchar('size', { length: 20 }),
  color: varchar('color', { length: 30 }),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
}, (t) => ({
  orderIdx: index('order_items_order_idx').on(t.orderId),
}));

// ─────────────────────────── Returns ───────────────────────────

export const returns = pgTable('returns', {
  id: serial('id').primaryKey(),
  returnNumber: varchar('return_number', { length: 30 }).notNull().unique(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  status: returnStatus('status').notNull().default('pending'),
  reason: text('reason').notNull(),
  description: text('description').notNull().default(''),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  approvedBy: integer('approved_by').references(() => users.id, { onDelete: 'set null' }),
  rejectionReason: text('rejection_reason'),
  refundAmount: decimal('refund_amount', { precision: 12, scale: 2 }),
  refundReference: varchar('refund_reference', { length: 200 }),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  riderId: integer('rider_id').references(() => users.id, { onDelete: 'set null' }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('returns_user_idx').on(t.userId),
  orderIdx: index('returns_order_idx').on(t.orderId),
  numberIdx: uniqueIndex('returns_number_idx').on(t.returnNumber),
}));

// ─────────────────────────── Memberships ───────────────────────────

export const memberships = pgTable('memberships', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  tier: tierName('tier').notNull().default('Standard'),
  cycle: billingCycle('cycle').notNull().default('monthly'),
  status: memberStatus('status').notNull().default('active'),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).notNull(),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull().defaultNow(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  scheduledDowngradeTo: tierName('scheduled_downgrade_to'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('memberships_user_idx').on(t.userId),
}));

export const membershipTiers = pgTable('membership_tiers', {
  id: serial('id').primaryKey(),
  tier: tierName('tier').notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  billingCycles: jsonb('billing_cycles').$type<('monthly' | 'quarterly' | 'yearly')[]>().notNull().default(['monthly']),
  features: jsonb('features').$type<string[]>().notNull().default([]),
  description: text('description').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  tier: customerTier('tier').notNull().default('standard'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes'),
}, (t) => ({
  userIdx: index('members_user_idx').on(t.userId),
}));

// ─────────────────────────── Marketing & Content ───────────────────────────

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 60 }).notNull().unique(),
  subject: varchar('subject', { length: 200 }).notNull(),
  body: text('body').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 60 }).notNull().default('system'),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  /** 'inapp' | 'email' | 'both' */
  channels: varchar('channels', { length: 30 }).notNull().default('inapp'),
  /** 'all' | 'tier' | 'user' */
  scope: varchar('scope', { length: 30 }).notNull().default('user'),
  /** When scope='user', the recipient user id. */
  targetUserId: integer('target_user_id').references(() => users.id, { onDelete: 'cascade' }),
  /** When scope='tier', the tier name. */
  targetTier: varchar('target_tier', { length: 30 }),
  /** Who sent it (admin / moderator / system / customer). */
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: varchar('author_name', { length: 200 }).notNull().default('system'),
  authorRole: varchar('author_role', { length: 30 }).notNull().default('system'),
  /** Per-user read flag map. */
  readBy: jsonb('read_by').$type<Record<string, boolean>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('notifications_user_idx').on(t.targetUserId),
  scopeIdx: index('notifications_scope_idx').on(t.scope),
}));

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 200 }).notNull().unique(),
  source: varchar('source', { length: 60 }).notNull().default('footer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const homepage = pgTable('homepage', {
  id: serial('id').primaryKey(),
  // Single-row table (id=1) for the landing page hero + featured grids
  heroImage: text('hero_image'),
  heroHeadline: varchar('hero_headline', { length: 200 }),
  heroTagline: text('hero_tagline'),
  featuredProductIds: jsonb('featured_product_ids').$type<number[]>().notNull().default([]),
  lookbookImageIds: jsonb('lookbook_image_ids').$type<string[]>().notNull().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  imageUrl: text('image_url').notNull(),
  link: text('link'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const lookbook = pgTable('lookbook', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  imageUrl: text('image_url').notNull(),
  description: text('description'),
  season: varchar('season', { length: 60 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  customerRole: varchar('customer_role', { length: 200 }),
  quote: text('quote').notNull(),
  rating: integer('rating').notNull().default(5),
  approved: boolean('approved').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const branding = pgTable('branding', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 60 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const paymentGateways = pgTable('payment_gateways', {
  id: serial('id').primaryKey(),
  provider: varchar('provider', { length: 60 }).notNull().unique(),
  enabled: boolean('enabled').notNull().default(true),
  publicKey: text('public_key'),
  secretKeyMask: text('secret_key_mask'),
  webhookUrl: text('webhook_url'),
  config: jsonb('config').$type<Record<string, unknown>>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────── Audit Log ───────────────────────────

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  userName: varchar('user_name', { length: 200 }),
  userRole: varchar('user_role', { length: 60 }),
  action: varchar('action', { length: 80 }).notNull(),
  entityType: varchar('entity_type', { length: 60 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }),
  entityLabel: varchar('entity_label', { length: 200 }),
  summary: text('summary').notNull(),
  changes: jsonb('changes').$type<{ before?: unknown; after?: unknown } | null>(),
  ip: varchar('ip', { length: 64 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('audit_log_user_idx').on(t.userId),
  entityIdx: index('audit_log_entity_idx').on(t.entityType, t.entityId),
  createdIdx: index('audit_log_created_idx').on(t.createdAt),
}));

// ─────────────────────────── Relations ───────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  orders: many(orders),
  addresses: many(addresses),
  refreshTokens: many(refreshTokens),
  riderProfile: one(riderProfiles, { fields: [users.id], references: [riderProfiles.userId] }),
  membership: one(memberships, { fields: [users.id], references: [memberships.userId] }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  returns: many(returns),
  deliveries: many(deliveries),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  order: one(orders, { fields: [returns.orderId], references: [orders.id] }),
  user: one(users, { fields: [returns.userId], references: [users.id] }),
}));

export const riderProfilesRelations = relations(riderProfiles, ({ one }) => ({
  user: one(users, { fields: [riderProfiles.userId], references: [users.id] }),
}));

// ─────────────────────────── Type Exports ───────────────────────────

export type UserRole = (typeof userRole.enumValues)[number];
export type CustomerTier = (typeof customerTier.enumValues)[number];
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type ReturnStatus = (typeof returnStatus.enumValues)[number];
export type DeliveryStatus = (typeof deliveryStatus.enumValues)[number];
export type RiderStatus = (typeof riderStatus.enumValues)[number];

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
// ─────────────────────────── Discounts ───────────────────────────

// Tier-based automatic discount for Deluxe/Elite customers
export const tierDiscounts = pgTable('tier_discounts', {
  tier: varchar('tier', { length: 30 }).primaryKey(), // 'Deluxe' | 'Elite'
  percent: decimal('percent', { precision: 5, scale: 2 }).notNull(), // e.g. 5.00 = 5%
  description: text('description').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Admin-configured global event discount (e.g. "Black Friday 15% off")
export const eventDiscounts = pgTable('event_discounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description').notNull().default(''),
  percent: decimal('percent', { precision: 5, scale: 2 }).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  active: boolean('active').notNull().default(true),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  activeIdx: index('event_discounts_active_idx').on(t.active),
}));

// ─────────────────────────── Bespoke Requests ───────────────────────────
export const bespokeRequests = pgTable('bespoke_requests', {
  id: serial('id').primaryKey(),
  reference: varchar('reference', { length: 30 }).notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  customerEmail: varchar('customer_email', { length: 200 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }).notNull().default(''),
  occasion: varchar('occasion', { length: 200 }).notNull(), // wedding, gala, etc.
  budget: decimal('budget', { precision: 12, scale: 2 }),
  timeline: varchar('timeline', { length: 200 }).notNull().default(''),
  description: text('description').notNull(),
  measurements: jsonb('measurements').$type<Record<string, string>>().notNull().default({}),
  status: varchar('status', { length: 30 }).notNull().default('new'), // new | in_review | quoted | accepted | declined | complete
  assignedTo: integer('assigned_to').references(() => users.id),
  adminNotes: text('admin_notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  statusIdx: index('bespoke_status_idx').on(t.status),
}));

// ─────────────────────────── Contact Messages ───────────────────────────
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  email: varchar('email', { length: 200 }).notNull(),
  subject: varchar('subject', { length: 300 }).notNull(),
  body: text('body').notNull(),
  resolved: boolean('resolved').notNull().default(false),
  resolvedBy: integer('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────── Password Reset Tokens ───────────────────────────
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────── Email Verify Tokens ───────────────────────────
export const emailVerifyTokens = pgTable('email_verify_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────── 2FA Email OTPs ───────────────────────────
export const twoFactorOtps = pgTable('two_factor_otps', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  codeHash: varchar('code_hash', { length: 128 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  attempts: integer('attempts').notNull().default(0),
  // Why this OTP was issued:
  //   'login'             — 2FA at sign-in
  //   'forgot_password'   — user requested a password reset (replaces token link)
  //   'oauth_email_verify'— verify email after first OAuth signup
  //   'set_password'      — OAuth user is setting their first password
  purpose: varchar('purpose', { length: 32 }).notNull().default('login'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('two_factor_user_idx').on(t.userId),
  purposeIdx: index('two_factor_purpose_idx').on(t.userId, t.purpose),
}));

export type TierDiscount = typeof tierDiscounts.$inferSelect;
export type EventDiscount = typeof eventDiscounts.$inferSelect;
export type BespokeRequest = typeof bespokeRequests.$inferSelect;
export type NewBespokeRequest = typeof bespokeRequests.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type EmailVerifyToken = typeof emailVerifyTokens.$inferSelect;
export type TwoFactorOtp = typeof twoFactorOtps.$inferSelect;

// ─── Security lockouts ────────────────────────────────────────────
// After 5 consecutive failed attempts at any auth-sensitive flow
// (OTP verification, password change, etc.), the user is locked out
// and must contact support to unlock. Tracks:
//   - which flow was being attempted (purpose / action)
//   - how many attempts have been made (count)
//   - when the lockout expires (NULL = permanent until support)
//   - when the user can try again (NULL = permanently locked)
export const securityLockouts = pgTable('security_lockouts', {
  id: serial('id').primaryKey(),
  // The locked-out user. For forgot-password (where we don't require
  // auth yet), this is set after the user is identified by email.
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  // Optional: the email that triggered the lockout. Allows us to lock
  // a row before we know which user it belongs to (forgot-password).
  email: varchar('email', { length: 200 }),
  // Why they were locked:
  //   'otp_login'              — too many failed /api/auth/2fa/verify
  //   'otp_forgot_password'    — too many failed /api/auth/forgot-password/verify
  //   'otp_oauth_email_verify' — too many failed /api/auth/oauth/verify-email/verify
  //   'otp_set_password'       — too many failed /api/auth/oauth/set-password/complete
  //   'change_password'        — too many failed /api/auth/change-password
  //   'forgot_password_send'   — too many /api/auth/forgot-password requests
  reason: varchar('reason', { length: 64 }).notNull(),
  // Number of failed attempts in the current window.
  attempts: integer('attempts').notNull().default(0),
  // First attempt time in this window.
  windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull().defaultNow(),
  // Lockout expiry. NULL = permanent (must contact support to lift).
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  // When the lock was first imposed.
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  // Whether the lock is still active.
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userReasonIdx: index('security_lockouts_user_reason_idx').on(t.userId, t.reason),
  emailReasonIdx: index('security_lockouts_email_reason_idx').on(t.email, t.reason),
  activeIdx: index('security_lockouts_active_idx').on(t.isActive),
}));

export type SecurityLockout = typeof securityLockouts.$inferSelect;
export type NewSecurityLockout = typeof securityLockouts.$inferInsert;
