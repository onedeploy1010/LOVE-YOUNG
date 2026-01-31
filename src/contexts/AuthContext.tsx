import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { SupabaseUser } from '@/lib/supabase';
import type { Member, Partner } from '@shared/types';
import { useAuthStore, initAuthListener, type UserRole } from '@/stores/authStore';

export type { UserRole };

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  member: Member | null;
  partner: Partner | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string }) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  sendOTP: (email: string) => Promise<{ error: Error | null }>;
  verifyOTP: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start auth listener once on mount
  useEffect(() => {
    initAuthListener();
  }, []);

  // Read all values from the Zustand store (auto-subscribes to changes)
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const member = useAuthStore((s) => s.member);
  const partner = useAuthStore((s) => s.partner);
  const role = useAuthStore((s) => s.role);
  const loading = useAuthStore((s) => s.loading);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const sendOTP = useAuthStore((s) => s.sendOTP);
  const verifyOTP = useAuthStore((s) => s.verifyOTP);
  const signOut = useAuthStore((s) => s.signOut);
  const getAccessToken = useAuthStore((s) => s.getAccessToken);
  const refreshUserData = useAuthStore((s) => s.refreshUserData);

  const value: AuthContextType = {
    user,
    session,
    member,
    partner,
    role,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    sendOTP,
    verifyOTP,
    signOut,
    getAccessToken,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
