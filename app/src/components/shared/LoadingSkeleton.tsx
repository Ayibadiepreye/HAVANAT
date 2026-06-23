import { cn } from '@/lib/utils';

export default function LoadingSkeleton({ className, rows = 5 }: { className?: string; rows?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}
