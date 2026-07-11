import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  Sparkles,
  Clock,
  MapPin,
  ShieldCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface DojoEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedProgram?: string;
}

export default function DojoEnrollmentModal({
  isOpen,
  onClose,
  preSelectedProgram = "adult"
}: DojoEnrollmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: preSelectedProgram,
    trialDay: 'Lunes',
    message: '',
    acceptTerms: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const programs = [
    { id: 'kid', name: 'Little Warriors (4 a 7 años)' },
    { id: 'adult', name: 'Youth & Adults (8 años en adelante)' }
  ];

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Por favor indica el nombre completo del participante.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Por favor provee un correo electrónico válido.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Por favor provee un número de contacto.');
      return;
    }

    setIsSubmitting(true);

    // Simulate real high-fidelity submission pipeline
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  const selectedProgramDetails = programs.find(p => p.id === formData.program);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#0e131d] border border-white/10 text-gray-700 shadow-2xl z-10"
          >
            {/* Top red sash decoration */}
            <div className="h-2 bg-gradient-to-r from-brand-red via-brand-accent to-brand-red w-full" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-1.5 text-gray-700/50 hover:text-gray-700 hover:bg-white/10 transition-colors z-20"
              aria-label="Cerrar formulario"
            >
              <X className="w-5 h-5" />
            </button>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-brand-accent mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider font-display">Clase de cortesía</span>
                  </div>
                  <h3 className="text-2xl font-bold font-display text-gray-700">
                    Inicia tu Entrenamiento
                  </h3>
                  <p className="text-xs text-gray-700/60 mt-1">
                    Completa tus datos para reservar tu pase gratuito. No se requiere experiencia previa.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-lg flex items-start gap-3 text-sm text-brand-red">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Participant Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700/80 block">
                      Nombre del Participante *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Rodrigo González"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-brand-accent transition-colors focus:ring-1 focus:ring-brand-accent"
                      required
                    />
                  </div>

                  {/* Program of Interest */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700/80 block">
                      Programa de Interés
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {programs.map(prog => (
                        <button
                          key={prog.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, program: prog.id })}
                          className={`px-3 py-2.5 rounded-xl text-left text-xs transition-all border ${formData.program === prog.id
                              ? 'bg-brand-accent/10 border-brand-accent text-brand-accent font-bold'
                              : 'bg-white/5 border-white/10 text-gray-700/70 hover:bg-white/10'
                            }`}
                        >
                          {prog.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multi contact fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700/80 block">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-brand-accent transition-colors focus:ring-1 focus:ring-brand-accent"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700/80 block">
                        Teléfono de Contacto (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (---) --- ----"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-brand-accent transition-colors focus:ring-1 focus:ring-brand-accent"
                        required
                      />
                    </div>
                  </div>

                  {/* Class Day Booking Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700/80 block">
                        Día sugerido para demo
                      </label>
                      <select
                        value={formData.trialDay}
                        onChange={e => setFormData({ ...formData, trialDay: e.target.value })}
                        className="w-full bg-[#161d2b] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-brand-accent transition-colors"
                      >
                        {days.map(d => (
                          <option key={d} value={d} className="bg-[#0e131d]">{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700/80 block">
                        ¿Cómo nos conociste? (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Redes sociales, amigo, cartel"
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-brand-accent transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="termsAccept"
                    checked={formData.acceptTerms}
                    onChange={e => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="rounded border-white/20 bg-white/5 text-brand-accent focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="termsAccept" className="text-[11px] text-gray-700/60 cursor-pointer select-none">
                    Acepto recibir recordatorios de mi clase muestra por WhatsApp / Correo.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-accent hover:bg-brand-accent-hover text-gray-700 font-bold py-4 rounded-xl text-sm transition-all focus:outline-none belt-glow cursor-pointer relative flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verificando Tatami libre...
                    </>
                  ) : (
                    <>
                      RESERVAR CLASE DE PRUEBA GRATIS
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center space-y-6"
              >
                <div className="w-16 h-16 bg-brand-accent/10 border border-brand-accent/20 rounded-full flex items-center justify-center mx-auto text-brand-accent">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-display">¡Reserva de Clase Recibida!</h3>
                  <p className="text-sm text-gray-700/70">
                    Hola <span className="text-brand-accent font-bold">{formData.name}</span>, hemos reservado un lugar de cortesía para ti.
                  </p>
                </div>

                {/* Dojo instruction card */}
                <div className="bg-[#141b29] border border-white/5 rounded-xl p-4 text-left space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Fecha y Categoría Agendada</p>
                      <p className="text-xs text-gray-700/70">Próximo {formData.trialDay} en {selectedProgramDetails?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Ubicación de Tosei Gusoku</p>
                      <p className="text-xs text-gray-700/70">Av. 27 de Febrero #204, Bella Vista, Santo Domingo.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Recomendaciones del Dojo</p>
                      <p className="text-[11px] text-gray-700/60">
                        • Favor de asistir 10 minutos antes.<br />
                        • Usar ropa deportiva cómoda (sin botones ni cierres de metal).<br />
                        • Traer termo con agua propia. Entrenamos descalzos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-gray-700/50">
                    Un asesor técnico te contactará vía WhatsApp al <span className="text-brand-accent">{formData.phone}</span> para re-confirmar el horario exacto.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    onClose();
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-gray-700 font-bold py-3.5 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Entendido, ¡allá estaré en la fecha!
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
