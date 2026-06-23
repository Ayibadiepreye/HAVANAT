import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/dashboard';

const ROLE_STYLES: Record<UserRole, string> = {
  customer: 'bg-gray-100 text-gray-700',
  admin: 'bg-black text-white',
  moderator: 'bg-indigo-100 text-indigo-800',
  rider: 'bg-green-100 text-green-800',
};

export default function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] font-semibold',
      ROLE_STYLES[role],
      className
    )}>
      {role}
    </span>
  );
}
