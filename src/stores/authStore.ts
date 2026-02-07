import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, type SupabaseUser } from '@/lib/supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { Member, Partner } from '@shared/types';

export type UserRole = 'user' | 'member' | 'partner' | 'admin';

interface AuthState {
  // Persisted state (restored instantly from localStorage)
  user: SupabaseUser | null;
  member: Member | null;
  partner: Partner | null;
  role: UserRole;

  // Non-persisted (transient)
  session: Session | null;
  loading: boolean;
  _initialized: boolean;

  // Actions
  _setSession: (s: Session | null) => void;
  _setLoading: (v: boolean) => void;
  _setInitialized: (v: boolean) => void;
  _setUser: (u: SupabaseUser | null) => void;
  _setMember: (m: Member | null) => void;
  _setPartner: (p: Partner | null) => void;
  _setRole: (r: UserRole) => void;
  fetchUserData: (userId: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  clearAuth: () => void;

  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string }) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  sendOTP: (email: string) => Promise<{ error: Error | null }>;
  verifyOTP: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      member: null,
      partner: null,
      role: 'user',
      session: null,
      loading: true,
      _initialized: false,

      // Internal setters
      _setSession: (s) => set({ session: s }),
      _setLoading: (v) => set({ loading: v }),
      _setInitialized: (v) => set({ _initialized: v }),
      _setUser: (u) => set({ user: u }),
      _setMember: (m) => set({ member: m }),
      _setPartner: (p) => set({ partner: p }),
      _setRole: (r) => set({ role: r }),

      clearAuth: () => set({
        user: null,
        session: null,
        member: null,
        partner: null,
        role: 'user',
      }),

      fetchUserData: async (userId: string) => {
        // Helper: check if all results have AbortError (browser extension interference)
        const isAbortError = (res: { error: { message?: string } | null }) =>
          res.error?.message?.includes('AbortError') || res.error?.message?.includes('signal is aborted');

        const doFetch = async () => {
          const [userRes, memberRes, adminRpc] = await Promise.all([
            supabase.from('users').select('role').eq('id', userId).single(),
            supabase.from('members').select('*').eq('user_id', userId).single(),
            supabase.rpc('is_admin'),
          ]);
          return { userRes, memberRes, adminRpc };
        };

        try {
          // Run all three queries in parallel for speed.
          // is_admin() is SECURITY DEFINER — always works regardless of RLS.
          let { userRes, memberRes, adminRpc } = await doFetch();

          // If ALL queries failed with AbortError, retry once after 1s.
          // This happens when browser extensions interfere with Supabase's Web Locks.
          if (isAbortError(userRes) && isAbortError(memberRes)) {
            console.warn('[auth] All queries aborted, retrying in 1s...');
            await new Promise(r => setTimeout(r, 1000));
            ({ userRes, memberRes, adminRpc } = await doFetch());
          }

          if (userRes.error) {
            console.warn('[auth] users query error:', userRes.error.message, userRes.error.code);
          }
          if (memberRes.error && memberRes.error.code !== 'PGRST116') {
            console.warn('[auth] members query error:', memberRes.error.message, memberRes.error.code);
          }

          const memberData = memberRes.data;

          // Determine admin from: is_admin() RPC (most reliable), users.role, OR members.role
          const isAdmin = adminRpc.data === true || userRes.data?.role === 'admin' || memberData?.role === 'admin';
          console.info('[auth] fetchUserData:', { userId, isAdmin, hasMember: !!memberData, userRole: userRes.data?.role, memberRole: memberData?.role, rpcAdmin: adminRpc.data });

          if (memberData) {
            const memberObj: Member = {
              id: memberData.id,
              userId: memberData.user_id,
              name: memberData.name,
              phone: memberData.phone,
              email: memberData.email,
              role: memberData.role,
              pointsBalance: memberData.points_balance,
              preferredFlavor: memberData.preferred_flavor,
              preferredPackage: memberData.preferred_package,
              referralCode: memberData.referral_code,
              referrerId: memberData.referrer_id,
              createdAt: memberData.created_at,
            };

            // If partner/admin, also fetch partner data in parallel
            let partnerObj: Partner | null = null;
            if (memberData.role === 'partner' || memberData.role === 'admin' || isAdmin) {
              const { data: partnerData } = await supabase
                .from('partners')
                .select('*')
                .eq('member_id', memberData.id)
                .single();

              if (partnerData) {
                partnerObj = {
                  id: partnerData.id,
                  memberId: partnerData.member_id,
                  referralCode: partnerData.referral_code,
                  tier: partnerData.tier,
                  status: partnerData.status,
                  referrerId: partnerData.referrer_id,
                  lyBalance: partnerData.ly_balance,
                  cashWalletBalance: partnerData.cash_wallet_balance,
                  rwaTokens: partnerData.rwa_tokens,
                  totalSales: partnerData.total_sales,
                  totalCashback: partnerData.total_cashback,
                  paymentAmount: partnerData.payment_amount,
                  paymentDate: partnerData.payment_date,
                  paymentReference: partnerData.payment_reference,
                  packagesPurchased: partnerData.packages_purchased ?? 1,
                  totalBoxesProcessed: partnerData.total_boxes_processed ?? 0,
                  createdAt: partnerData.created_at,
                  updatedAt: partnerData.updated_at,
                };
              }
            }

            const newRole: UserRole = isAdmin ? 'admin' : partnerObj ? 'partner' : 'member';
            console.info('[auth] resolved role:', newRole, { isAdmin, hasPartner: !!partnerObj });
            set({ member: memberObj, partner: partnerObj, role: newRole });
          } else {
            set({
              member: null,
              partner: null,
              role: isAdmin ? 'admin' : 'user',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Preserve current role on error — don't downgrade admin to user
          const currentRole = get().role;
          if (currentRole === 'user') {
            // Only reset if already lowest role; otherwise keep cached role
            set({ member: null, partner: null });
          }
        }
      },

      refreshUserData: async () => {
        const { user, fetchUserData } = get();
        if (user?.id) {
          await fetchUserData(user.id);
        }
      },

      // Auth methods
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? new Error(error.message) : null };
      },

      signUp: async (email, password, metadata) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        });
        return { error: error ? new Error(error.message) : null };
      },

      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        return { error: error ? new Error(error.message) : null };
      },

      sendOTP: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true },
        });
        return { error: error ? new Error(error.message) : null };
      },

      verifyOTP: async (email, token) => {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });
        return { error: error ? new Error(error.message) : null };
      },

      signOut: async () => {
        // Clear state immediately for instant UI feedback
        set({
          user: null,
          session: null,
          member: null,
          partner: null,
          role: 'user',
        });
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error('Sign out error:', err);
        }
      },

      getAccessToken: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
      },
    }),
    {
      name: 'loveyoung-auth',
      version: 4,
      migrate: (_persisted: unknown, version: number) => {
        if (version < 4) {
          // Preserve ALL cached state across upgrades.
          // fetchUserData will correct stale data in background.
          const p = _persisted as Record<string, unknown> | null;
          console.info('[auth] cache upgrade v' + version + '→4');
          return {
            user: p?.user ?? null,
            member: p?.member ?? null,
            partner: p?.partner ?? null,
            role: p?.role ?? 'user',
          };
        }
        return _persisted;
      },
      // Only persist these fields to localStorage
      partialize: (state) => ({
        user: state.user,
        member: state.member,
        partner: state.partner,
        role: state.role,
      }),
    }
  )
);

// Initialize auth listener — call once at app startup
let _listenerActive = false;

export function initAuthListener() {
  if (_listenerActive) return;
  _listenerActive = true;

  const store = useAuthStore.getState();

  // If we have a cached user, show immediately — don't block on fetching.
  // onAuthStateChange will update role/member/partner in background.
  if (store.user) {
    store._setLoading(false);
  }

  // Safety timeout: if onAuthStateChange doesn't fire within 3s, clear loading
  // This prevents infinite spinner if Supabase is slow or network fails
  const safetyTimeout = setTimeout(() => {
    const currentState = useAuthStore.getState();
    if (currentState.loading && !currentState._initialized) {
      console.warn('[auth] Safety timeout: clearing loading after 3s');
      currentState._setLoading(false);
      currentState._setInitialized(true);
    }
  }, 3000);

  supabase.auth.onAuthStateChange(
    async (event: AuthChangeEvent, session: Session | null) => {
      // Cancel safety timeout immediately when ANY auth event fires
      clearTimeout(safetyTimeout);

      const s = useAuthStore.getState();
      console.info('[auth] onAuthStateChange:', event, { hasSession: !!session, cachedUser: !!s.user });
      s._setSession(session);

      if (session?.user) {
        const supabaseUser: SupabaseUser = {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        };
        s._setUser(supabaseUser);

        // Fetch user data — this determines role (member/partner/admin)
        await s.fetchUserData(session.user.id).catch((err) => {
          console.error('[auth] fetchUserData failed:', err);
        });
        useAuthStore.getState()._setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        s.clearAuth();
        useAuthStore.getState()._setLoading(false);
      } else if (s.user) {
        console.info('[auth] null session with cached user, keeping cached state');
        useAuthStore.getState()._setLoading(false);
      } else {
        useAuthStore.getState()._setLoading(false);
      }

      useAuthStore.getState()._setInitialized(true);
    }
  );
}
