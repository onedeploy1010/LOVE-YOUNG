import { useAuthStore, type UserRole } from '@/stores/authStore';

export type { UserRole };

/**
 * Pure hook — reads directly from the Zustand auth store.
 * No React Context or Provider needed. initAuthListener() is called by AuthGate in App.tsx.
 */
export function useAuth() {
  return {
    user: useAuthStore((s) => s.user),
    session: useAuthStore((s) => s.session),
    member: useAuthStore((s) => s.member),
    partner: useAuthStore((s) => s.partner),
    role: useAuthStore((s) => s.role),
    loading: useAuthStore((s) => s.loading),
    signIn: useAuthStore((s) => s.signIn),
    signUp: useAuthStore((s) => s.signUp),
    signInWithGoogle: useAuthStore((s) => s.signInWithGoogle),
    sendOTP: useAuthStore((s) => s.sendOTP),
    verifyOTP: useAuthStore((s) => s.verifyOTP),
    signOut: useAuthStore((s) => s.signOut),
    getAccessToken: useAuthStore((s) => s.getAccessToken),
    refreshUserData: useAuthStore((s) => s.refreshUserData),
  };
}
