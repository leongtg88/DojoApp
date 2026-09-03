'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  User,
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
import { TermsModal } from './TermsModal';
import { PrivacyModal } from './PrivacyModal';

interface SignUpFormProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export function SignUpForm({ onSuccess, onNavigateToLogin }: SignUpFormProps) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Real-time checks
  const isLengthValid = password.length >= 8;
  const isMatchValid = confirmPassword.length > 0 && password === confirmPassword;
  const isMatchInvalid = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('El nombre completo debe tener al menos 2 caracteres.');
      return;
    }

    if (!dateOfBirth) {
      setErrorMessage('Por favor selecciona tu fecha de nacimiento.');
      return;
    }

    if (new Date(`${dateOfBirth}T00:00:00`) > new Date()) {
      setErrorMessage('La fecha de nacimiento no puede estar en el futuro.');
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

    if (!acceptedTerms) {
      setErrorMessage('Debes aceptar los Términos de Servicio y la Política de Privacidad.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          dateOfBirth,
          email: emailTrimmed,
          password,
        }),
      });
      const res = await response.json() as { success?: boolean; error?: string };

      if (!response.ok || !res.success) {
        setErrorMessage(res.error || 'Error al registrar la cuenta.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        if (onNavigateToLogin) {
          onNavigateToLogin();
        } else {
          router.push('/login');
        }
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Ocurrió un error inesperado durante el registro.');
      setIsLoading(false);
    }
  };

  return (
    <div id="signup-form-container" className="w-full max-w-md mx-auto py-2">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">
            Admisión • Karate Shito Ryu
          </span>
        </div>
        <h2 className="text-3xl lg:text-4xl font-light tracking-tight text-white mb-2">
          Crear Cuenta
        </h2>
        <p className="text-sm text-white/40 leading-relaxed font-light">
          Completa tus datos para unirte al sistema de entrenamiento de Tosei Gusoku Dojo.
        </p>
      </div>

      {/* Success banner */}
      {successMessage && (
        <motion.div
          id="signup-success-banner"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 flex items-start gap-3 text-sm shadow-lg shadow-emerald-950/20"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-emerald-200">Registro exitoso</span>
            <span className="text-xs text-emerald-300/80 leading-relaxed">{successMessage}</span>
          </div>
        </motion.div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <motion.div
          id="signup-error-banner"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 flex items-start gap-3 text-sm shadow-lg shadow-red-950/20"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1">
            <span className="font-semibold block text-red-200">Error al procesar el formulario</span>
            <span className="text-xs text-red-300/80 leading-relaxed">{errorMessage}</span>
          </div>
        </motion.div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Full name */}
        <div className="space-y-2">
          <label
            htmlFor="signup-name-input"
            className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block"
          >
            Nombre Completo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
              <User className="w-4 h-4" />
            </div>
            <input
              id="signup-name-input"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Juan Pérez"
              className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Date of birth */}
        <div className="space-y-2">
          <label
            htmlFor="signup-date-of-birth-input"
            className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block"
          >
            Fecha de nacimiento
          </label>
          <input
            id="signup-date-of-birth-input"
            name="dateOfBirth"
            type="date"
            autoComplete="bday"
            required
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all shadow-inner"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="signup-email-input"
            className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block"
          >
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="signup-email-input"
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

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="signup-password-input"
            className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block"
          >
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="signup-password-input"
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
              id="btn-toggle-signup-password"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Real-time length feedback */}
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

        {/* Confirm Password */}
        <div className="space-y-2">
          <label
            htmlFor="signup-confirm-password-input"
            className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block"
          >
            Confirmar Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="signup-confirm-password-input"
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
              className={`w-full pl-11 pr-11 py-3.5 bg-white/5 border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all shadow-inner ${
                isMatchValid
                  ? 'border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30'
                  : isMatchInvalid
                  ? 'border-red-500/80 focus:ring-1 focus:ring-red-500/30'
                  : 'border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/10'
              }`}
            />
            <button
              id="btn-toggle-signup-confirm-password"
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
              aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Ver confirmación'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Real-time match feedback as requested in 8.2: "check verde / X roja" */}
          {confirmPassword.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {isMatchValid ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Las contraseñas coinciden
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1 font-medium">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  Las contraseñas no coinciden
                </span>
              )}
            </div>
          )}
        </div>

        {/* Terms and Privacy Policy with interactive modals */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-white/40">
            <input
              id="checkbox-accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/10 bg-white/5 accent-white text-black focus:ring-white/20"
            />
            <span className="leading-relaxed">
              Acepto los{' '}
              <button
                id="link-terms-modal"
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="text-white hover:underline underline-offset-4"
              >
                Términos de Servicio
              </button>{' '}
              y la{' '}
              <button
                id="link-privacy-modal"
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="text-white hover:underline underline-offset-4"
              >
                Política de Privacidad
              </button>{' '}
              del Dojo.
            </span>
          </label>
        </div>

        {/* Submit button */}
        <div className="pt-3">
          <button
            id="btn-submit-signup"
            type="submit"
            disabled={isLoading || !isLengthValid || !isMatchValid}
            className="hero-button w-full shadow-xl shadow-black/50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Registrando cuenta...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Crear Cuenta</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Login link */}
      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-xs text-white/40 tracking-wide">
          ¿Ya tienes cuenta en el dojo?{' '}
          {onNavigateToLogin ? (
            <button
              id="link-go-to-login"
              type="button"
              onClick={onNavigateToLogin}
              className="text-white font-medium hover:underline ml-1 underline-offset-4 transition-all"
            >
              Inicia sesión aquí
            </button>
          ) : (
            <Link
              id="link-go-to-login"
              href="/login"
              className="text-white font-medium hover:underline ml-1 underline-offset-4 transition-all"
            >
              Inicia sesión aquí
            </Link>
          )}
        </p>
      </div>

      {/* Modals */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => setAcceptedTerms(true)}
      />
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onAccept={() => setAcceptedTerms(true)}
      />
    </div>
  );
}
