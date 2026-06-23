import { useState, useMemo } from 'react';
import { useAuditLogStore } from '@/stores/useAuditLogStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import RoleBadge from '@/components/admin/RoleBadge';
import StatsCard from '@/components/admin/StatsCard';
import { Search, X, RotateCcw, Download, Calendar } from 'lucide-react';
import { formatDateTime, relativeTime } from '@/utils/formatters';
import type { AuditLogEntry, AuditAction, AuditEntityType } from '@/types/dashboard';

const PAGE_SIZE = 50;

export default function AdminAuditLog() {
  const logs = useAuditLogStore((s) => s.logs);
  const revertLog = useAuditLogStore((s) => s.revertLog);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | AuditAction>('all');
  const [entityFilter, setEntityFilter] = useState<'all' | AuditEntityType>('all');
  const [userFilter, setUserFilter] = useState<'all' | string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [diff, setDiff] = useState<AuditLogEntry | null>(null);

  const todayKey = '2026-06-23';
  const stats = useMemo(() => {
    const today = logs.filter((l) => l.timestamp.slice(0, 10) === todayKey);
    const users = new Map<string, number>();
    logs.forEach((l) => users.set(l.userName, (users.get(l.userName) ?? 0) + 1));
    const mostActive = Array.from(users.entries()).sort((a, b) => b[1] - a[1])[0];
    const entities = new Map<string, number>();
    logs.forEach((l) => entities.set(l.entityType, (entities.get(l.entityType) ?? 0) + 1));
    const mostEdited = Array.from(entities.entries()).sort((a, b) => b[1] - a[1])[0];
    return { actionsToday: today.length, mostActive: mostActive?.[0] ?? '—', mostEdited: mostEdited?.[0] ?? '—' };
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (entityFilter !== 'all' && l.entityType !== entityFilter) return false;
      if (userFilter !== 'all' && l.userName !== userFilter) return false;
      if (dateFrom && l.timestamp.slice(0, 10) < dateFrom) return false;
      if (dateTo && l.timestamp.slice(0, 10) > dateTo) return false;
      if (search) {
        const q = search.toLowerCase();
        return l.userName.toLowerCase().includes(q) || l.entityId.toLowerCase().includes(q) || l.entityLabel.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, actionFilter, entityFilter, userFilter, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const userOptions = useMemo(() => Array.from(new Set(logs.map((l) => l.userName))), [logs]);

  const columns: Column<AuditLogEntry>[] = [
    { key: 'timestamp', label: 'Timestamp', render: (l) => <div><p className="text-xs">{formatDateTime(l.timestamp)}</p><p className="text-[10px] text-gray-400">{relativeTime(l.timestamp)}</p></div> },
    {
      key: 'user', label: 'User', render: (l) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-black text-white flex items-center justify-center text-[10px] font-semibold rounded-full">{l.userName[0]}</div>
          <div><p className="text-sm">{l.userName}</p><RoleBadge role={l.userRole} /></div>
        </div>
      ),
    },
    { key: 'action', label: 'Action', render: (l) => <StatusBadge status={l.action} type="action" /> },
    { key: 'entity', label: 'Entity', render: (l) => <div><p className="text-xs capitalize">{l.entityType.replace(/_/g, ' ')}</p><p className="text-[10px] text-gray-500">{l.entityLabel}</p></div> },
    { key: 'summary', label: 'Summary', render: (l) => <span className="text-xs text-gray-600 line-clamp-1">{l.summary}</span> },
    {
      key: 'actions', label: '', align: 'right', width: '150px',
      render: (l) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setDiff(l)} className="px-2 py-1 text-[9px] uppercase tracking-wider border border-gray-300 hover:border-black">View</button>
          {l.action !== 'revert' && l.changes.before && l.changes.after && (
            <button
              onClick={() => {
                if (!dashboardUser) return;
                revertLog(l.id, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
                showToast(`Reverted ${l.entityLabel}`, 'success');
              }}
              className="px-2 py-1 text-[9px] uppercase tracking-wider border border-yellow-400 text-yellow-800 hover:bg-yellow-50 flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Revert
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleExportCsv = () => {
    const rows = ['ID,Timestamp,User,Role,Action,Entity,Entity Label,Summary'];
    filtered.forEach((l) => {
      rows.push([l.id, l.timestamp, l.userName, l.userRole, l.action, l.entityType, l.entityLabel, l.summary].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `havanat-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-light">Audit Log</h2>
          <p className="text-sm text-gray-500 mt-1">Every change is recorded.</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] border border-gray-300 hover:border-black flex items-center gap-2"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="Actions Today" value={String(stats.actionsToday)} change="+12% vs yesterday" trend="up" />
        <StatsCard label="Most Active User" value={stats.mostActive} change="Across all roles" trend="flat" />
        <StatsCard label="Most Edited Entity" value={stats.mostEdited} change="This week" trend="flat" />
      </div>

      <div className="bg-white border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search user, entity, summary..." className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
        </div>
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value as 'all' | AuditAction); setPage(1); }} className="text-sm border border-gray-200 px-3 py-2.5 bg-white">
          <option value="all">All Actions</option>
          {['create', 'update', 'delete', 'revert', 'status_change', 'assign'].map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value as 'all' | AuditEntityType); setPage(1); }} className="text-sm border border-gray-200 px-3 py-2.5 bg-white">
          <option value="all">All Entities</option>
          {['product', 'order', 'return', 'rider', 'member', 'membership_tier', 'homepage', 'lookbook', 'testimonial', 'banner', 'branding', 'settings'].map((e) => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-200 px-3 py-2.5 bg-white">
          <option value="all">All Users</option>
          {userOptions.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <div className="md:col-span-2 flex gap-2">
          <div className="flex-1 relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
          <div className="flex-1 relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
          </div>
        </div>
      </div>

      <AdminTable<AuditLogEntry>
        columns={columns}
        rows={paged}
        keyFn={(l) => l.id}
        emptyMessage="No audit entries match your filters"
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: Math.min(totalPages, 6) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-9 w-9 text-xs uppercase tracking-wider ${page === i + 1 ? 'bg-black text-white' : 'bg-white border border-gray-200 hover:border-black'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {diff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setDiff(null)}>
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Audit Detail</p>
                <h3 className="font-serif text-2xl font-light mt-1">{diff.entityLabel}</h3>
              </div>
              <button onClick={() => setDiff(null)} aria-label="Close" className="hover:opacity-70"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">User</p><p>{diff.userName}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Role</p><RoleBadge role={diff.userRole} /></div>
                <div><p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Action</p><StatusBadge status={diff.action} type="action" /></div>
                <div><p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">When</p><p>{formatDateTime(diff.timestamp)}</p></div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Summary</p>
                <p className="text-sm">{diff.summary}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-semibold">Before</h4>
                  <pre className="bg-red-50 border border-red-100 p-4 text-xs overflow-auto max-h-80 font-mono whitespace-pre-wrap">
                    {diff.changes.before ? JSON.stringify(diff.changes.before, null, 2) : '(none — created)'}
                  </pre>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-semibold">After</h4>
                  <pre className="bg-green-50 border border-green-100 p-4 text-xs overflow-auto max-h-80 font-mono whitespace-pre-wrap">
                    {diff.changes.after ? JSON.stringify(diff.changes.after, null, 2) : '(none — deleted)'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
