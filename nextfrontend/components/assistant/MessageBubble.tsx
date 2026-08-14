type Role = 'assistant' | 'user';

export default function MessageBubble({ role, children }: { role: Role; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
          role === 'assistant' ? 'border border-white/10 bg-zinc-800 text-gray-200' : 'bg-brand-accent text-black'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
