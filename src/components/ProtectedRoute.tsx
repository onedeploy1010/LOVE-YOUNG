import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';

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
  const { user, role } = useAuth();

  // AuthGate guarantees loading is done — no loading check needed here.

  if (!user) {
    return <Redirect to={redirectTo} />;
  }

  // Check role requirements
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const userRoleLevel = roleHierarchy[role];

  const hasAccess = requiredRoles.some(reqRole => {
    const requiredLevel = roleHierarchy[reqRole];
    if (role === 'admin') return true;
    return userRoleLevel >= requiredLevel;
  });

  if (!hasAccess) {
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
