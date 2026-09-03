'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, CheckCircle, ArrowRight, Loader2, KeyRound } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export function ForgotPasswordModal({ isOpen, onClose, defaultEmail = '' }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [prevDefault, setPrevDefault] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync defaultEmail when prop changes during render
  if (prevDefault !== defaultEmail) {
    setPrevDefault(defaultEmail);
    setEmail(defaultEmail);
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar enlace');
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-forgot-password-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            id="modal-forgot-password-card"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-[#0f0f0f] rounded-2xl shadow-2xl border border-white/10 overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-6 bg-[#141414] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-white to-gray-500 flex items-center justify-center text-black shadow-md">
                  <KeyRound className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-base leading-tight uppercase tracking-widest text-white">
                    Recuperar Contraseña
                  </h3>
                  <p className="text-[10px] text-white/40 tracking-wider uppercase font-mono">Tosei Gusoku Dojo</p>
                </div>
              </div>
              <button
                id="btn-close-forgot-modal"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/60 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-800/60">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-sans font-light text-white text-xl">
                      ¡Enlace Enviado!
                    </h4>
                    <p className="text-sm text-white/50 mt-2 leading-relaxed">
                      Hemos enviado instrucciones seguras de restablecimiento a:
                      <br />
                      <strong className="text-white font-medium">{email}</strong>
                    </p>
                    <p className="text-xs text-white/30 mt-2">
                      Si no lo encuentras en tu bandeja principal, revisa la carpeta de spam o correo no deseado.
                    </p>
                  </div>
                  <button
                    id="btn-confirm-forgot-success"
                    onClick={handleClose}
                    className="hero-button w-full shadow-lg"
                  >
                    Entendido, volver al inicio
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <p className="text-xs text-white/50 leading-relaxed">
                    Ingresa el correo electrónico asociado a tu cuenta de estudiante o instructor. Te enviaremos un enlace temporal para crear una nueva contraseña.
                  </p>

                  <div className="space-y-2">
                    <label htmlFor="recovery-email" className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="recovery-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="usuario@toseigusoku.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all shadow-inner"
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-red-400 mt-2 font-medium flex items-center gap-1">
                        <span>●</span> {error}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      id="btn-submit-recovery"
                      type="submit"
                      disabled={isSubmitting}
                      className="hero-button flex-1 shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span>Enviar Enlace</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
