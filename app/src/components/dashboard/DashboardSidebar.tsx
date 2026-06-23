import { cn } from '@/lib/utils';

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  title: string;
  subtitle: string;
  items: SidebarItem[];
  currentPath: string;
  onNavigate?: (href: string) => void;
  bottomNote?: { label: string; href: string };
  className?: string;
}

export default function DashboardSidebar({ title, subtitle, items, currentPath, onNavigate, bottomNote, className }: SidebarProps) {
  return (
    <aside className={cn('w-64 bg-black text-white fixed h-screen overflow-y-auto flex flex-col', className)}>
      <div className="p-6 border-b border-gray-800 flex-shrink-0">
        <h2 className="font-serif text-xl text-white">{title}</h2>
        <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mt-1 font-medium">{subtitle}</p>
      </div>

      <nav className="py-6 flex-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href || (item.href !== '/admin' && item.href !== '/moderator' && item.href !== '/rider' && currentPath.startsWith(item.href));
          const handleClick = (e: React.MouseEvent) => {
            if (onNavigate) {
              e.preventDefault();
              onNavigate(item.href);
            }
          };
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={handleClick}
              className={cn(
                'flex items-center gap-3 px-6 py-3 text-[11px] uppercase tracking-[0.15em] font-medium transition-colors',
                isActive
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:bg-gray-900 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {bottomNote && (
        <div className="p-6 border-t border-gray-800 flex-shrink-0">
          <a
            href={bottomNote.href}
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate(bottomNote.href);
              }
            }}
            className="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-white flex items-center gap-2"
          >
            <span>←</span> {bottomNote.label}
          </a>
        </div>
      )}
    </aside>
  );
}
