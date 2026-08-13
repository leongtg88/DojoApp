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
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          type="submit"
          className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Enviar
        </button>
      </div>
      {validationError && <p className="mt-1 text-xs text-red-600">{validationError}</p>}
    </form>
  );
}
