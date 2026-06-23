import { useState } from 'react';
import { useMembershipStore } from '@/stores/useMembershipStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatNaira } from '@/utils/formatters';
import { Plus, Check, Trash2, Crown } from 'lucide-react';
import type { MembershipTier } from '@/types';

type TierName = 'Standard' | 'Deluxe' | 'Elite';

export default function AdminMemberships() {
  const tiers = useMembershipStore((s) => s.tiers);
  const saveTier: (tierName: TierName, next: MembershipTier, actor: { id: string; name: string; role: 'admin' | 'moderator' }) => void = useMembershipStore((s) => s.saveTier);
  const dashboardUser = useAuthStore((s) => s.dashboardUser);
  const showToast = useUIStore((s) => s.showToast);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-light">Membership Tiers</h2>
        <p className="text-sm text-gray-500 mt-1">Edit pricing, billing cycles, and perks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <TierCard
            key={t.tier}
            tier={t}
            onSave={(next) => {
              if (!dashboardUser) return;
              saveTier(t.tier as TierName, next, { id: dashboardUser.id, name: dashboardUser.name, role: 'admin' });
              showToast(`${t.tier} tier updated`, 'success');
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TierCard({ tier, onSave }: { tier: MembershipTier; onSave: (t: MembershipTier) => void }) {
  const [price, setPrice] = useState(tier.price);
  const [billing, setBilling] = useState(tier.billing);
  const [features, setFeatures] = useState(tier.features);
  const [newFeature, setNewFeature] = useState('');
  const [description, setDescription] = useState(tier.description);

  const isPopular = tier.tier === 'Deluxe';

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };
  const removeFeature = (i: number) => setFeatures(features.filter((_, idx) => idx !== i));

  return (
    <div className="bg-white border border-gray-200 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          <h3 className="font-serif text-2xl font-light">{tier.tier}</h3>
        </div>
        {isPopular && <span className="text-[9px] uppercase tracking-widest bg-black text-white px-2 py-0.5">Popular</span>}
      </div>
      <p className="text-xs text-gray-500 mb-4">{tier.description}</p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Monthly Price (₦)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1.5">{price === 0 ? 'Free Forever' : `Equivalent to ${formatNaira(price * 12)}/year`}</p>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Billing Description</label>
          <input
            value={billing}
            onChange={(e) => setBilling(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:border-black focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Billing Cycles</label>
          <div className="grid grid-cols-3 gap-2">
            {['Monthly', 'Quarterly', 'Yearly'].map((c) => (
              <button
                key={c}
                type="button"
                className={`px-3 py-2 text-[10px] uppercase tracking-wider border ${billing.toLowerCase().includes(c.toLowerCase()) ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}
                onClick={() => setBilling(c === 'Monthly' ? 'per month' : c === 'Yearly' ? 'per year' : 'per quarter')}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-medium">Features</label>
          <ul className="space-y-1.5 mb-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="flex-1">{f}</span>
                <button onClick={() => removeFeature(i)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
              </li>
            ))}
          </ul>
          <div className="flex gap-1.5">
            <input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              placeholder="Add a feature..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 focus:border-black focus:outline-none"
            />
            <button onClick={addFeature} className="px-3 py-2 bg-black text-white"><Plus className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      <button
        onClick={() => onSave({ ...tier, price, billing, description, features })}
        className="mt-6 w-full py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors"
      >Save Changes</button>
    </div>
  );
}
