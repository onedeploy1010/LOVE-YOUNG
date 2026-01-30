import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, type SupabaseUser } from '@/lib/supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { Member, Partner } from '@shared/types';

export type UserRole = 'user' | 'member' | 'partner' | 'admin';

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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  // Fetch member and partner data for a user (runs in background, does NOT block loading)
  const fetchUserData = async (userId: string) => {
    try {
      // Check if user is admin in users table
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      const isAdmin = userData?.role === 'admin';

      // Always load member record (admins can also be members/partners)
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .single();

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
        setMember(memberObj);

        // Check if member is a partner
        if (memberData.role === 'partner' || memberData.role === 'admin' || isAdmin) {
          const { data: partnerData } = await supabase
            .from('partners')
            .select('*')
            .eq('member_id', memberData.id)
            .single();

          if (partnerData) {
            const partnerObj: Partner = {
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
              createdAt: partnerData.created_at,
              updatedAt: partnerData.updated_at,
            };
            setPartner(partnerObj);
            setRole(isAdmin ? 'admin' : 'partner');
          } else {
            setRole(isAdmin ? 'admin' : 'member');
          }
        } else {
          setRole(isAdmin ? 'admin' : 'member');
        }
      } else {
        setRole(isAdmin ? 'admin' : 'user');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setRole('user');
    }
  };

  const refreshUserData = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        const supabaseUser: SupabaseUser = {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        };
        setUser(supabaseUser);
        // Wait for role to be determined before clearing loading,
        // so ProtectedRoute won't redirect prematurely.
        await fetchUserData(session.user.id).catch(() => {});
        if (mounted) setLoading(false);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        setSession(session);
        if (session?.user) {
          const supabaseUser: SupabaseUser = {
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          };
          setUser(supabaseUser);

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await fetchUserData(session.user.id).catch(() => {});
          }
          if (mounted) setLoading(false);
        } else {
          setUser(null);
          setMember(null);
          setPartner(null);
          setRole('user');
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, metadata?: { first_name?: string; last_name?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const sendOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const verifyOTP = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    // Always clear local state even if Supabase call fails
    setUser(null);
    setSession(null);
    setMember(null);
    setPartner(null);
    setRole('user');
  };

  const getAccessToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  return (
    <AuthContext.Provider value={{
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
    }}>
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
