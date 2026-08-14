export default function QuickReplies({ options, onSelect }: { options: string[]; onSelect: (option: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className="rounded-full border border-brand-accent/40 bg-zinc-800 px-4 py-2 text-sm font-medium text-brand-accent transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
