// Types for dashboards, audit, orders, returns, riders, deliveries, content

export type UserRole = 'customer' | 'admin' | 'moderator' | 'rider';
export type CustomerTier = 'standard' | 'deluxe' | 'elite';

export interface DashboardUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tier?: CustomerTier;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: number;
  name: string;
  image: string;
  size: string;
  quantity: number;
  price: number;
}

export interface DashboardOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
  };
  riderId?: string;
  trackingHistory: TrackingEvent[];
  notes?: string;
}

export interface TrackingEvent {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export type ReturnStatus =
  | 'pending'
  | 'approved'
  | 'rider_scheduled'
  | 'completed'
  | 'rejected';

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: { productId: number; name: string; image: string; size: string; quantity: number }[];
  reason: string;
  description: string;
  images: string[];
  status: ReturnStatus;
  date: string;
  pickupAddress: { street: string; city: string; state: string };
  riderId?: string;
  adminNote?: string;
}

export type RiderStatus = 'active' | 'suspended' | 'pending';

export interface Rider {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicleType: 'Bike' | 'Car' | 'Van';
  plateNumber: string;
  status: RiderStatus;
  idVerified: boolean;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  joinedAt: string;
  bank: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export type DeliveryStatus =
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed';

export type DeliveryType = 'delivery' | 'pickup';

export interface ProofOfDelivery {
  photoUrl?: string;
  signatureDataUrl?: string;
  timestamp: string;
}

export interface Delivery {
  id: string;
  orderId?: string;
  returnId?: string;
  riderId: string;
  type: DeliveryType;
  status: DeliveryStatus;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  itemSummary: string;
  itemCount: number;
  scheduledFor: string;
  pickupOtp?: string;
  deliveryOtp?: string;
  proofOfDelivery?: ProofOfDelivery;
  notes?: string;
  deliveryFee: number;
  completedAt?: string;
}

export interface Payout {
  id: string;
  riderId: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'processing';
  method: 'Bank Transfer';
  reference?: string;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'revert' | 'login' | 'status_change' | 'assign';
export type AuditEntityType =
  | 'product'
  | 'order'
  | 'return'
  | 'rider'
  | 'member'
  | 'membership_tier'
  | 'homepage'
  | 'lookbook'
  | 'testimonial'
  | 'banner'
  | 'branding'
  | 'delivery'
  | 'settings';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  summary: string;
  changes: {
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  };
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: CustomerTier;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  nextBillingDate: string;
  status: 'active' | 'cancelled' | 'paused';
  totalSpent: number;
  joinedAt: string;
  avatar?: string;
}

export interface ActivityItem {
  id: string;
  type: 'order' | 'member' | 'return' | 'product';
  message: string;
  timestamp: string;
  userName: string;
}

export interface ContentHomepage {
  heroImage: string;
  headline: string;
  tagline: string;
  featuredCollectionIds: number[];
  updatedAt: string;
}

export interface LookbookImage {
  id: string;
  url: string;
  caption: string;
  order: number;
}

export interface DashboardTestimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  approved: boolean;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  link: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
}

export interface Branding {
  logoLight: string;
  logoDark: string;
  favicon: string;
  primaryGray: string;
  accentGray: string;
  updatedAt: string;
}

export interface DeliveryZone {
  id: string;
  state: string;
  fee: number;
  eta: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preview: string;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'moderator';
  createdAt: string;
}
