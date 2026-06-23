import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyFn: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
}

export default function AdminTable<T>({
  columns,
  rows,
  keyFn,
  onRowClick,
  emptyMessage = 'No data found',
  className,
  selectable,
  selectedIds = [],
  onSelectChange,
}: AdminTableProps<T>) {
  const allSelected = selectable && rows.length > 0 && selectedIds.length === rows.length;
  const toggleAll = () => {
    if (!onSelectChange) return;
    onSelectChange(allSelected ? [] : rows.map((r) => keyFn(r)));
  };
  const toggleOne = (id: string) => {
    if (!onSelectChange) return;
    onSelectChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };
  return (
    <div className={cn('bg-white border border-gray-200 overflow-x-auto', className)}>
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr className="text-left">
            {selectable && (
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-600',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center'
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-12 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = keyFn(row);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(id)}
                        onChange={() => toggleOne(id)}
                        className="cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center'
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
