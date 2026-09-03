'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Lock, Check } from 'lucide-react';
import { DOJO_INFO } from '@/lib/auth-data';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function PrivacyModal({ isOpen, onClose, onAccept }: PrivacyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-privacy-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            id="modal-privacy-card"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl bg-[#0f0f0f] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-6 bg-[#141414] border-b border-white/5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-white to-gray-500 flex items-center justify-center text-black shadow-md">
                  <ShieldCheck className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-base uppercase tracking-widest text-white">
                    Política de Privacidad
                  </h3>
                  <p className="text-[10px] text-white/40 tracking-wider uppercase font-mono">{DOJO_INFO.name} • Protección de Datos</p>
                </div>
              </div>
              <button
                id="btn-close-privacy"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Cerrar política de privacidad"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm text-white/60 leading-relaxed font-light">
              <div>
                <h4 className="font-sans font-bold uppercase text-[11px] tracking-[0.2em] mb-1.5 text-white/90">
                  1. Recopilación de Información
                </h4>
                <p>
                  En <strong className="text-white font-medium">{DOJO_INFO.name}</strong> recopilamos datos personales indispensables para la gestión marcial: nombre completo, correo electrónico, fecha de nacimiento, contacto de emergencia y datos de progresión de cinturones en Shito Ryu Inoue Ha.
                </p>
              </div>

              <div>
                <h4 className="font-sans font-bold uppercase text-[11px] tracking-[0.2em] mb-1.5 text-white/90">
                  2. Uso de los Datos
                </h4>
                <p>
                  La información recopilada se utiliza exclusivamente para:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-white/60 pl-2">
                  <li>Validación y seguridad de acceso a la plataforma del dojo.</li>
                  <li>Seguimiento de asistencia, evaluaciones de pase de grado y torneos.</li>
                  <li>Notificaciones oficiales de horarios, eventos y contacto de emergencia.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-sans font-bold uppercase text-[11px] tracking-[0.2em] mb-1.5 text-white/90">
                  3. Seguridad y Confidencialidad
                </h4>
                <p>
                  Implementamos almacenamiento cifrado y autenticación JWT para resguardar las credenciales. Jamás comercializamos ni transferimos tus datos a terceros con fines publicitarios ajenos a la academia.
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-xs text-white/50 leading-relaxed">
                  Cumplimos con las normativas locales e internacionales de privacidad y consentimiento expreso para menores de edad con autorización de tutores legales.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#141414] border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Cerrar
              </button>
              {onAccept && (
                <button
                  id="btn-accept-privacy-modal"
                  type="button"
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="hero-button py-2.5 px-5 shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-black" />
                  <span>Entendido</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
