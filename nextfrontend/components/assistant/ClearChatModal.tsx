'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface ClearChatModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ClearChatModal({ isOpen, onCancel, onConfirm }: ClearChatModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-chat-title"
            aria-describedby="clear-chat-desc"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 text-center shadow-2xl z-10"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <h3 id="clear-chat-title" className="mt-4 font-display text-lg font-bold text-white">
              ¿Limpiar conversación?
            </h3>
            <p id="clear-chat-desc" className="mt-2 text-sm text-gray-400">
              Se borrará todo el progreso de esta conversación y empezarás de nuevo. Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                autoFocus
                className="flex-1 cursor-pointer rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Sí, limpiar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
