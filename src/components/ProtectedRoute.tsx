import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
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

export function ProtectedRoute({
  children,
  requiredRole = 'user',
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    setLocation(redirectTo);
    return null;
  }

  // Check role requirements
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const userRoleLevel = roleHierarchy[role];

  // Check if user has any of the required roles or higher
  const hasAccess = requiredRoles.some(reqRole => {
    const requiredLevel = roleHierarchy[reqRole];
    // Admin can access everything
    if (role === 'admin') return true;
    // Check if user's role level is >= required level
    return userRoleLevel >= requiredLevel;
  });

  if (!hasAccess) {
    // Redirect based on user's actual role
    if (role === 'partner') {
      setLocation('/member/partner');
    } else if (role === 'member') {
      setLocation('/member');
    } else {
      setLocation('/');
    }
    return null;
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
  // Allow any authenticated user to access member pages
  // The page itself will prompt them to complete profile if needed
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
