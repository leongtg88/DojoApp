export default function PriceCard({
  title,
  value,
  description,
  originalPrice,
  badge,
}: {
  title: string;
  value: string;
  description?: string;
  originalPrice?: string;
  badge?: string;
}) {
  return (
    <div className="max-w-[85%] rounded-2xl border border-white/10 bg-zinc-800 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white">{title}</h3>
        {badge && (
          <span className="shrink-0 rounded-full bg-brand-accent/20 px-2.5 py-0.5 text-xs font-bold text-brand-accent">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        {originalPrice && (
          <span className="text-sm text-gray-500 line-through">{originalPrice}</span>
        )}
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
      {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
    </div>
  );
}
