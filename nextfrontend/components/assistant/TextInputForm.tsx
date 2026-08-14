'use client';

import { useState } from 'react';

export default function TextInputForm({
  placeholder,
  onSubmit,
  validationError,
}: {
  placeholder: string;
  onSubmit: (value: string) => boolean;
  validationError?: string;
}) {
  const [value, setValue] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (onSubmit(value)) setValue('');
      }}
      className="mt-4"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder || 'Escribe aquí…'}
          autoFocus
          className="flex-1 rounded-full border border-white/10 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-accent px-4 py-2 text-sm font-medium text-black hover:bg-brand-accent/80 focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          Enviar
        </button>
      </div>
      {validationError && <p className="mt-1 text-xs text-brand-accent">{validationError}</p>}
    </form>
  );
}
