'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Role, User, Session } from './types';
import { SEED_USERS } from './auth-data';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  viewMode: 'responsive' | 'desktop' | 'mobile';
  setViewMode: (mode: 'responsive' | 'desktop' | 'mobile') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'tosei_registered_users';
const SESSION_STORAGE_KEY = 'tosei_current_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'responsive' | 'desktop' | 'mobile'>('responsive');

  // Load session & initialize registered users in localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (!storedUsers) {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_USERS));
        }

        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          const parsed = JSON.parse(storedSession) as Session;
          if (new Date(parsed.expires) > new Date()) {
            queueMicrotask(() => {
              setSession(parsed);
              setUser({
                id: parsed.user.id,
                name: parsed.user.name,
                email: parsed.user.email,
                role: parsed.user.role,
                emailVerified: true,
                createdAt: new Date().toISOString(),
                belt: parsed.user.belt,
              });
            });
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.error('Error loading auth state:', e);
    } finally {
      queueMicrotask(() => {
        setIsLoading(false);
      });
    }
  }, []);


  const getUsersPool = (): (User & { password: string })[] => {
    if (typeof window === 'undefined') return SEED_USERS;
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(e);
    }
    return SEED_USERS;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    // Artificial latency for authentic server feel
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanEmail = email.trim().toLowerCase();
    const users = getUsersPool();

    const found = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!found) {
      return {
        success: false,
        error: 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.',
      };
    }

    const newSession: Session = {
      user: {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        belt: found.belt || 'Cinturón Blanco',
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
      // Set cookie for middleware/server if needed
      document.cookie = `tosei_session=${encodeURIComponent(JSON.stringify(newSession))}; path=/; max-age=604800; SameSite=Lax`;
    }

    setSession(newSession);
    setUser(found);

    return { success: true, user: found };
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const cleanEmail = email.trim().toLowerCase();
    const users = getUsersPool();

    const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return {
        success: false,
        error: 'Ya existe una cuenta registrada con este correo electrónico.',
      };
    }

    const newUser: User & { password: string } = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: Role.STUDENT,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      belt: 'Cinturón Blanco (Principiante)',
    };

    const updated = [...users, newUser];
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
    }

    return { success: true, user: newUser };
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      document.cookie = 'tosei_session=; path=/; max-age=0';
    }
    setSession(null);
    setUser(null);
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 750));
    return {
      success: true,
      message: `Hemos enviado un enlace de recuperación seguro a ${email}. Revisa tu bandeja de entrada o spam.`,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        login,
        register,
        logout,
        sendPasswordReset,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
