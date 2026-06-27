interface StatsCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'flat';
  sublabel?: string;
}

export default function StatsCard({ label, value, change, trend, sublabel }: StatsCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';
  return (
    <div className="bg-white border border-gray-200 p-4 sm:p-6 hover:border-black transition-colors">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 sm:mb-2 font-medium">
        {label}
      </p>
      <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-black break-words leading-tight">{value}</p>
      {change && (
        <p className={`text-xs mt-1.5 sm:mt-2 ${trendColor}`}>{change}</p>
      )}
      {sublabel && (
        <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">{sublabel}</p>
      )}
    </div>
  );
}
