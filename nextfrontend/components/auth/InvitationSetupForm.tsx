'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

export function InvitationSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLengthValid = password.length >= 8;
  const isMatchValid = confirmPassword.length > 0 && password === confirmPassword;
  const isMatchInvalid = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!token) {
      setErrorMessage('El enlace de invitación está incompleto. Revisa el correo recibido.');
      return;
    }

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setErrorMessage('Por favor ingresa un correo electrónico válido (ej: usuario@empresa.com).');
      return;
    }

    if (!isLengthValid) {
      setErrorMessage('La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas ingresadas no coinciden. Verifícalas antes de continuar.');
      return;
    }

    setIsLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch('/api/auth/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: emailTrimmed,
          password,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const res = await response.json() as { success?: boolean; error?: string };

      if (!response.ok || !res.success) {
        setErrorMessage(res.error || 'Error al crear la cuenta.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: unknown) {
      clearTimeout(timeout);
      const isTimeout = (err as Error)?.name === 'AbortError';
      setErrorMessage(
        isTimeout
          ? 'El servidor tardó demasiado en responder. Inténtalo de nuevo en unos minutos.'
          : (err as Error)?.message || 'Ocurrió un error inesperado al crear la cuenta.',
      );
      setIsLoading(false);
    }
  };

  return (
    <div id="invitation-form-container" className="w-full max-w-md mx-auto py-2">
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">
            Invitación • Karate Shito Ryu
          </span>
        </div>
        <h2 className="text-3xl lg:text-4xl font-light tracking-tight text-white mb-2">
          Crear tu cuenta
        </h2>
        <p className="text-sm text-white/40 leading-relaxed font-light">
          Tu expediente ya fue creado por el dojo. Define tu contraseña para acceder a tu progreso.
        </p>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-white/50 flex items-start gap-3 text-sm">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          El correo no puede cambiarse: debe coincidir con el que usó el dojo para invitarte.
        </p>
      </div>

      {successMessage && (
        <motion.div
          id="invitation-success-banner"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 flex items-start gap-3 text-sm shadow-lg shadow-emerald-950/20"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-emerald-200">Cuenta creada</span>
            <span className="text-xs text-emerald-300/80 leading-relaxed">{successMessage}</span>
          </div>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          id="invitation-error-banner"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 flex items-start gap-3 text-sm shadow-lg shadow-red-950/20"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1">
            <span className="font-semibold block text-red-200">No se pudo crear la cuenta</span>
            <span className="text-xs text-red-300/80 leading-relaxed">{errorMessage}</span>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="invitation-email-input" className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block">
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="invitation-email-input"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="usuario@toseigusoku.com"
              className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="invitation-password-input" className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block">
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="invitation-password-input"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="••••••••••••"
              className="w-full pl-11 pr-11 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all shadow-inner"
            />
            <button
              id="btn-toggle-invitation-password"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {isLengthValid ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mínimo 8 caracteres cumplido
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1 font-medium">
                  <XCircle className="w-3.5 h-3.5" /> Mínimo 8 caracteres ({password.length}/8)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="invitation-confirm-password-input" className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="invitation-confirm-password-input"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="••••••••••••"
              className={`w-full pl-11 pr-11 py-3.5 bg-white/5 border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all shadow-inner ${isMatchValid
                  ? 'border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30'
                  : isMatchInvalid
                    ? 'border-red-500/80 focus:ring-1 focus:ring-red-500/30'
                    : 'border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/10'
                }`}
            />
            <button
              id="btn-toggle-invitation-confirm-password"
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
              aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Ver confirmación'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {isMatchValid ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Las contraseñas coinciden
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1 font-medium">
                  <XCircle className="w-3.5 h-3.5 text-red-400" /> Las contraseñas no coinciden
                </span>
              )}
            </div>
          )}
        </div>

        <div className="pt-3">
          <button
            id="btn-submit-invitation"
            type="submit"
            disabled={isLoading || !isLengthValid || !isMatchValid}
            className="hero-button w-full shadow-xl shadow-black/50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Creando cuenta...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Crear cuenta</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}