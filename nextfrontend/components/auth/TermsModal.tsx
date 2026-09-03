'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, CheckCircle2, Shield } from 'lucide-react';
import { DOJO_INFO } from '@/lib/auth-data';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-terms-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            id="modal-terms-card"
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
                  <FileText className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-base uppercase tracking-widest text-white">
                    Términos de Servicio
                  </h3>
                  <p className="text-[10px] text-white/40 tracking-wider uppercase font-mono">{DOJO_INFO.name} • {DOJO_INFO.specialty}</p>
                </div>
              </div>
              <button
                id="btn-close-terms"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Cerrar términos"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm text-white/60 leading-relaxed font-light">
              <div>
                <h4 className="font-sans font-bold uppercase text-[11px] tracking-[0.2em] mb-1.5 text-white/90">
                  1. Principios del Dojo (Dojo Kun)
                </h4>
                <p>
                  El estudiante o tutor legal se compromete a respetar los principios tradicionales de cortesía, esfuerzo, disciplina, sinceridad y autocontrol que rigen en <strong className="text-white font-medium">{DOJO_INFO.name}</strong>. El karate practicado es Shito Ryu Inoue Ha, con énfasis en el crecimiento marcial integral.
                </p>
              </div>

              <div>
                <h4 className="font-sans font-bold uppercase text-[11px] tracking-[0.2em] mb-1.5 text-white/90">
                  2. Membresía y Clases
                </h4>
                <p>
                  Cada alumno tiene derecho a la primera clase de prueba gratuita. La inscripción mensual otorga acceso a las sesiones asignadas según su nivel y grupo de edad (niños desde 5 años y adultos) en nuestras instalaciones en {DOJO_INFO.location}.
                </p>
              </div>

              <div>
                <h4 className="font-sans font-bold uppercase text-[11px] tracking-[0.2em] mb-1.5 text-white/90">
                  3. Seguridad, Salud y Equipamiento
                </h4>
                <p>
                  El practicante debe portar el uniforme tradicional (Karategi) limpio y con su respectivo cinturón. Toda condición física o médica relevante debe ser declarada al momento de la inscripción para garantizar una práctica segura supervisada por instructores certificados.
                </p>
              </div>

              <div>
                <h4 className="font-sans font-bold uppercase text-[11px] tracking-[0.2em] mb-1.5 text-white/90">
                  4. Cancelación y Cuotas
                </h4>
                <p>
                  Las cuotas mensuales deben abonarse durante los primeros cinco días de cada ciclo. En caso de retiro temporal o congelamiento por causas justificadas, se debe notificar a la administración con un mínimo de 7 días de anticipación.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
                <Shield className="w-5 h-5 text-white/60 shrink-0 mt-0.5" />
                <p className="text-xs text-white/50 leading-relaxed">
                  Para consultas administrativas o soporte directo con los directores del Dojo, puedes comunicarte al WhatsApp oficial <strong className="text-white/80">{DOJO_INFO.whatsapp}</strong> o visitar <strong className="text-white/80">{DOJO_INFO.web}</strong>.
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
                  id="btn-accept-terms-modal"
                  type="button"
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="hero-button py-2.5 px-5 shadow-lg flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Aceptar Términos</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
