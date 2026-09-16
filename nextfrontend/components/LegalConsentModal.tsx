'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, ShieldCheck, Check, CheckCircle2, ChevronDown, Lock } from 'lucide-react';
import TerminosLegales from '@/components/TerminosLegales';
import PrivacidadDeDatos from '@/components/PrivacidadDeDatos';

interface LegalConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

type LegalTab = 'terms' | 'privacy';

const READ_THRESHOLD = 24;

export default function LegalConsentModal({ isOpen, onClose, onAccept }: LegalConsentModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>('terms');
  const [termsRead, setTermsRead] = useState(false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bothRead = termsRead && privacyRead;

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setActiveTab('terms');
      setTermsRead(false);
      setPrivacyRead(false);
      setAgreed(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const markActiveRead = useCallback(() => {
    if (activeTab === 'terms') setTermsRead(true);
    else setPrivacyRead(true);
  }, [activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    const raf = requestAnimationFrame(() => {
      if (el.scrollHeight <= el.clientHeight + READ_THRESHOLD) markActiveRead();
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTab, isOpen, markActiveRead]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - READ_THRESHOLD) markActiveRead();
  };

  const tabs: { id: LegalTab; label: string; icon: React.ReactNode; read: boolean }[] = [
    { id: 'terms', label: 'Términos y Condiciones', icon: <FileText className="w-4 h-4" />, read: termsRead },
    { id: 'privacy', label: 'Política de Privacidad', icon: <ShieldCheck className="w-4 h-4" />, read: privacyRead },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ type: 'spring', duration: 0.4 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-consent-title"
            className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl max-h-[90vh]"
          >
            <div className="flex shrink-0 items-center justify-between bg-gray-900 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-white to-gray-400 text-black shadow-md">
                  <Lock className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h3 id="legal-consent-title" className="font-display text-base font-bold uppercase tracking-widest text-white">
                    Antes de inscribirte
                  </h3>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">TOSEI GUSOKU DOJO CLUB · Shitoryu Karate Do</p>
                </div>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white" aria-label="Cerrar términos y condiciones">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex shrink-0 border-b border-gray-200 bg-white">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition-colors sm:text-sm ${activeTab === tab.id ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.read ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto bg-gray-50"
            >
              {activeTab === 'terms' ? <TerminosLegales embedded /> : <PrivacidadDeDatos embedded />}
            </div>

            <div className="shrink-0 space-y-3 border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px]">
                <span className={`flex items-center gap-1.5 ${termsRead ? 'text-green-700' : 'text-gray-500'}`}>
                  {termsRead ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 animate-bounce" />}
                  {termsRead ? 'Términos leídos' : 'Desplázate hasta el final de los Términos'}
                </span>
                <span className={`flex items-center gap-1.5 ${privacyRead ? 'text-green-700' : 'text-gray-500'}`}>
                  {privacyRead ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 animate-bounce" />}
                  {privacyRead ? 'Privacidad leída' : 'Desplázate hasta el final de la Privacidad'}
                </span>
              </div>

              <label className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${bothRead ? 'cursor-pointer border-gray-200 hover:bg-gray-50' : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'}`}>
                <input
                  type="checkbox"
                  checked={agreed}
                  disabled={!bothRead}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 text-brand-accent focus:ring-brand-accent focus:ring-offset-0 disabled:cursor-not-allowed"
                  aria-describedby="legal-consent-help"
                />
                <span className="text-xs leading-relaxed text-gray-600">
                  He leído, entendido y <strong className="text-gray-800">acepto</strong> los Términos y Condiciones de la escuela y la Política de Privacidad y Protección de Datos de TOSEI GUSOKU DOJO CLUB.
                </span>
              </label>
              <p id="legal-consent-help" className="text-[10px] text-gray-400">
                Debes leer ambos documentos y marcar la casilla para poder enviar tu inscripción.
              </p>

              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row sm:items-center">
                <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={!agreed}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Aceptar y enviar inscripción
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
