import { useState, useMemo } from 'react';
import { useMembershipStore } from '@/stores/useMembershipStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import AdminTable, { type Column } from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { X, Search } from 'lucide-react';
import { formatNaira, formatDate } from '@/utils/formatters';
import type { CustomerTier } from '@/types/dashboard';
import type { Member } from '@/types/dashboard';

export default function AdminMembers() {
  const members = useMembershipStore((s) => s.members);
  const setStatus = useMembershipStore((s) => s.setMemberStatus);
  const changeTier = useMembershipStore((s) => s.changeMemberTier);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);
  const [tierFilter, setTierFilter] = useState<'all' | CustomerTier>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState<Member | null>(null);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (tierFilter !== 'all' && m.tier !== tierFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [members, tierFilter, statusFilter, search]);

  const columns: Column<Member>[] = [
    { key: 'name', label: 'Name', render: (m) => <div><p className="font-medium">{m.name}</p><p className="text-xs text-gray-500">{m.email}</p></div> },
    { key: 'tier', label: 'Tier', render: (m) => <StatusBadge status={m.tier} type="tier" /> },
    { key: 'cycle', label: 'Cycle', render: (m) => <span className="capitalize text-xs">{m.billingCycle}</span> },
    { key: 'next', label: 'Next Billing', render: (m) => <span className="text-xs">{formatDate(m.nextBillingDate)}</span> },
    { key: 'spent', label: 'Total Spent', render: (m) => formatNaira(m.totalSpent), align: 'right' },
    { key: 'status', label: 'Status', render: (m) => <StatusBadge status={m.status} type="generic" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Members</h2>
        <p className="text-sm text-gray-500 mt-1">{members.length} members · {members.filter((m) => m.status === 'active').length} active</p>
      </div>

      <div className="bg-white border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email..." className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none" />
        </div>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as 'all' | CustomerTier)} className="text-sm border border-gray-200 px-3 py-2.5 bg-white">
          <option value="all">All Tiers</option>
          <option value="standard">Standard</option>
          <option value="deluxe">Deluxe</option>
          <option value="elite">Elite</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'paused' | 'cancelled')} className="text-sm border border-gray-200 px-3 py-2.5 bg-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <AdminTable<Member>
        columns={columns}
        rows={filtered}
        keyFn={(m) => m.id}
        onRowClick={setDetails}
        emptyMessage="No members match your filters"
      />

      {details && (
        <MemberDetailsModal
          member={details}
          onClose={() => setDetails(null)}
          onCancelSubscription={() => {
            if (!dashboardUser) return;
            setStatus(details.id, 'cancelled', { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
            showToast(`Cancelled ${details.name}'s subscription`, 'success');
            setDetails(null);
          }}
          onChangeTier={(t) => {
            if (!dashboardUser) return;
            changeTier(details.id, t, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
            showToast(`${details.name} moved to ${t}`, 'success');
            setDetails(null);
          }}
          onIssueRefund={() => {
            showToast(`Refund queued for ${details.name}`, 'success');
            setDetails(null);
          }}
        />
      )}
    </div>
  );
}

function MemberDetailsModal({
  member, onClose, onCancelSubscription, onChangeTier, onIssueRefund,
}: {
  member: Member;
  onClose: () => void;
  onCancelSubscription: () => void;
  onChangeTier: (t: CustomerTier) => void;
  onIssueRefund: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Member</p>
            <h3 className="font-serif text-2xl font-light mt-1">{member.name}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="hover:opacity-70"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Email" value={member.email} />
            <Field label="Phone" value={member.phone} />
            <Field label="Tier" value={<StatusBadge status={member.tier} type="tier" />} />
            <Field label="Cycle" value={<span className="capitalize">{member.billingCycle}</span>} />
            <Field label="Member Since" value={formatDate(member.startDate)} />
            <Field label="Next Billing" value={formatDate(member.nextBillingDate)} />
            <Field label="Total Spent" value={formatNaira(member.totalSpent)} />
            <Field label="Status" value={<StatusBadge status={member.status} type="generic" />} />
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-semibold">Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onChangeTier('standard')} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Change to Standard</button>
              <button onClick={() => onChangeTier('deluxe')} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Change to Deluxe</button>
              <button onClick={() => onChangeTier('elite')} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Change to Elite</button>
              <button onClick={onIssueRefund} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] border border-gray-300 hover:border-black">Issue Refund</button>
              <button onClick={onCancelSubscription} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] bg-red-600 text-white hover:bg-red-700">Cancel Subscription</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1 font-medium">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}
