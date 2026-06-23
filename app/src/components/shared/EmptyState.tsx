import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <h3 className="font-serif text-xl font-light mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
}
