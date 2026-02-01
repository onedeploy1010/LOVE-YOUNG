import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

// Role hierarchy: admin > partner > member > user
const roleHierarchy: Record<UserRole, number> = {
  user: 0,
  member: 1,
  partner: 2,
  admin: 3,
};

function checkRoleAccess(role: UserRole, requiredRole: UserRole | UserRole[]): boolean {
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const userRoleLevel = roleHierarchy[role];
  return requiredRoles.some(reqRole => {
    const requiredLevel = roleHierarchy[reqRole];
    if (role === 'admin') return true;
    return userRoleLevel >= requiredLevel;
  });
}

export function ProtectedRoute({
  children,
  requiredRole = 'user',
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, role } = useAuth();
  const initialized = useAuthStore((s) => s._initialized);

  if (!user) {
    // No cached user at all — redirect to login
    return <Redirect to={redirectTo} />;
  }

  const hasAccess = checkRoleAccess(role, requiredRole);

  if (!hasAccess) {
    // Cached role doesn't grant access, but auth may still be loading.
    // Wait for fetchUserData to complete before redirecting — the cached
    // role may be stale (e.g. 'user' from a previous broken session).
    if (!initialized) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
    // Auth is fully initialized, role is confirmed — redirect
    if (role === 'partner') return <Redirect to="/member/partner" />;
    if (role === 'member') return <Redirect to="/member" />;
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

// Specific role protection components for convenience
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" redirectTo="/auth/login">
      {children}
    </ProtectedRoute>
  );
}

export function PartnerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="partner" redirectTo="/partner/join">
      {children}
    </ProtectedRoute>
  );
}

export function MemberRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="user" redirectTo="/auth/login">
      {children}
    </ProtectedRoute>
  );
}

export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="user" redirectTo="/auth/login">
      {children}
    </ProtectedRoute>
  );
}
