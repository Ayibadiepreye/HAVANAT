import { cn } from '@/lib/utils';
import type { OrderStatus, ReturnStatus, DeliveryStatus, RiderStatus, AuditAction, CustomerTier } from '@/types/dashboard';

const ORDER_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const RETURN_STYLES: Record<ReturnStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rider_scheduled: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const DELIVERY_STYLES: Record<DeliveryStatus, string> = {
  assigned: 'bg-gray-100 text-gray-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const RIDER_STYLES: Record<RiderStatus, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

const ACTION_STYLES: Record<AuditAction, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  revert: 'bg-yellow-100 text-yellow-800',
  login: 'bg-gray-100 text-gray-800',
  status_change: 'bg-indigo-100 text-indigo-800',
  assign: 'bg-purple-100 text-purple-800',
};

const TIER_STYLES: Record<CustomerTier, string> = {
  standard: 'bg-gray-100 text-gray-800',
  deluxe: 'bg-blue-100 text-blue-800',
  elite: 'bg-black text-white',
};

const GENERIC_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-200 text-gray-600',
  scheduled: 'bg-indigo-100 text-indigo-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-gray-100 text-gray-800',
};

const SIZE = 'inline-flex items-center px-3 py-1 text-[10px] uppercase tracking-[0.15em] font-medium';

type BadgeType = 'order' | 'return' | 'delivery' | 'rider' | 'action' | 'tier' | 'generic';

function inferType(key: string): BadgeType {
  if (['create', 'update', 'delete', 'revert', 'login', 'status_change', 'assign'].includes(key)) return 'action';
  if (['standard', 'deluxe', 'elite'].includes(key)) return 'tier';
  if (['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(key)) return 'order';
  if (['approved', 'rider_scheduled', 'completed', 'rejected'].includes(key)) return 'return';
  if (['assigned', 'picked_up', 'in_transit', 'failed'].includes(key)) return 'delivery';
  if (['active', 'suspended'].includes(key)) return 'rider';
  return 'generic';
}

export interface StatusBadgeProps {
  status: string;
  className?: string;
  type?: BadgeType;
}

export default function StatusBadge({ status, className, type }: StatusBadgeProps) {
  const key = String(status);
  const resolved: BadgeType = type ?? inferType(key);
  let style = 'bg-gray-100 text-gray-800';
  if (resolved === 'order') style = ORDER_STYLES[status as OrderStatus] ?? style;
  else if (resolved === 'return') style = RETURN_STYLES[status as ReturnStatus] ?? style;
  else if (resolved === 'delivery') style = DELIVERY_STYLES[status as DeliveryStatus] ?? style;
  else if (resolved === 'rider') style = RIDER_STYLES[status as RiderStatus] ?? style;
  else if (resolved === 'action') style = ACTION_STYLES[status as AuditAction] ?? style;
  else if (resolved === 'tier') style = TIER_STYLES[status as CustomerTier] ?? style;
  else style = GENERIC_STYLES[key] ?? style;

  const label = key.replace(/_/g, ' ');

  return (
    <span className={cn(SIZE, style, className)}>
      {label}
    </span>
  );
}
