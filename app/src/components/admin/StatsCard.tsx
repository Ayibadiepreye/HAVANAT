interface StatsCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'flat';
}

export default function StatsCard({ label, value, change, trend }: StatsCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';
  return (
    <div className="bg-white border border-gray-200 p-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 font-medium">
        {label}
      </p>
      <p className="font-serif text-3xl md:text-4xl font-light text-black">{value}</p>
      {change && (
        <p className={`text-xs mt-2 ${trendColor}`}>{change}</p>
      )}
    </div>
  );
}
