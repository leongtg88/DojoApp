'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginFormProps {
  onSuccess?: () => void;
  onNavigateToRegister?: () => void;
  presetEmail?: string;
  presetPassword?: string;
}

export function LoginForm({
  onSuccess,
  onNavigateToRegister,
  presetEmail = '',
  presetPassword = '',
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState(presetPassword);
  const [prevPresets, setPrevPresets] = useState({ email: presetEmail, password: presetPassword });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Synchronize when presets change (e.g., from dev toolbar autofill)
  if (prevPresets.email !== presetEmail || prevPresets.password !== presetPassword) {
    setPrevPresets({ email: presetEmail, password: presetPassword });
    setEmail(presetEmail);
    setPassword(presetPassword);
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic format checks
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setErrorMessage('Por favor ingresa tu correo electrónico.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage('El formato de correo electrónico es inválido (ej: usuario@empresa.com).');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email: emailTrimmed,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setErrorMessage('Credenciales inválidas. Verifica tu correo y contraseña.');
        setIsLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        const callbackUrl = searchParams.get('callbackUrl');
        router.push(callbackUrl?.startsWith('/dashboard') ? callbackUrl : '/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Ocurrió un error inesperado al iniciar sesión.');
      setIsLoading(false);
    }
  };

  return (
    <div id="login-form-container" className="w-full max-w-md mx-auto py-2">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">
            Portal de Acceso Seguro
          </span>
        </div>
        <h2 className="text-3xl lg:text-4xl font-light tracking-tight text-white mb-3">
          Iniciar Sesión
        </h2>
        <div className="w-16 h-[3px] rounded-full mb-3" style={{ background: 'linear-gradient(90deg, var(--sand), var(--emerald), var(--bubblegum-pink))' }} />
        <p className="text-sm text-white/40 leading-relaxed font-light">
          Ingresa tus credenciales para establecer una sesión segura en el dojo.
        </p>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <motion.div
          id="login-error-banner"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 flex items-start gap-3 text-sm shadow-lg shadow-red-950/20"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1">
            <span className="font-semibold block text-red-200">Error de autenticación</span>
            <span className="text-xs text-red-300/80 leading-relaxed">{errorMessage}</span>
          </div>
        </motion.div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Email field */}
        <div className="space-y-2">
          <label
            htmlFor="login-email-input"
            className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block"
          >
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email-input"
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

        {/* Password field with toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password-input"
              className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold ml-1 block"
            >
              Contraseña
            </label>
            <button
              id="btn-forgot-password-link"
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password-input"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
              id="btn-toggle-login-password"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit button with animated hero styling and loading indicator */}
        <div className="pt-2">
          <button
            id="btn-submit-login"
            type="submit"
            disabled={isLoading}
            className="hero-button-dark w-full shadow-xl shadow-black/50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-current" />
                <span>Verificando credenciales...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Register link */}
      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-xs text-white/40 tracking-wide">
          ¿No tienes cuenta en el dojo?{' '}
          {onNavigateToRegister ? (
            <button
              id="link-go-to-register"
              type="button"
              onClick={onNavigateToRegister}
              className="text-white font-medium hover:underline ml-1 underline-offset-4 transition-all"
            >
              Crear cuenta
            </button>
          ) : (
            <Link
              id="link-go-to-register"
              href="/registro"
              className="text-white font-medium hover:underline ml-1 underline-offset-4 transition-all"
            >
              Crear cuenta
            </Link>
          )}
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        defaultEmail={email}
      />
    </div>
  );
}
