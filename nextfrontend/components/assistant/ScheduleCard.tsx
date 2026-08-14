export default function ScheduleCard({
  title,
  subtitle,
  ctaLabel,
  onCta,
}: {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <div className="max-w-[85%] rounded-2xl border border-white/10 bg-zinc-800 p-4 shadow-sm">
      <h3 className="font-semibold text-white">{title}</h3>
      {subtitle && <p className="mt-2 text-sm text-gray-300">{subtitle}</p>}
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-4 rounded-full bg-brand-accent px-4 py-2 text-sm font-medium text-black hover:bg-brand-accent/80 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
