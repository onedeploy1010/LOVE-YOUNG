// Re-export from AuthContext for backwards compatibility
import { useAuth as useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const { user, loading, role, member, partner, signOut } = useAuthContext();

  return {
    user: user ? {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      profileImageUrl: user.user_metadata?.avatar_url,
    } : null,
    isLoading: loading,
    isAuthenticated: !!user,
    role,
    member,
    partner,
    signOut,
  };
}
