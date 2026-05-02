'use client';

import { useMemo, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Shield, ShieldAlert, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If specified, checks for a specific module.action permission */
  module?: string;
  /** If specified, checks for a specific action within the module */
  action?: string;
  /** Fallback content when permission is denied (instead of default 403) */
  fallback?: ReactNode;
}

/**
 * ProtectedRoute — Wraps content that requires authentication.
 *
 * - Redirects to login page state if user is not authenticated
 * - Shows 403 page if user lacks the required permission
 *
 * Usage:
 *   <ProtectedRoute>  // Just check auth
 *     <Dashboard />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute module="students" action="create">  // Check specific permission
 *     <CreateStudentForm />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  module,
  action,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, isLoading, permissions } = useAuthStore();

  const authorized = useMemo(() => {
    if (isInitializing) return false;
    if (!isAuthenticated) return false;
    if (!module || !action) return true;
    return permissions.some((key) => {
      const parts = key.split('.');
      return parts.length >= 3 && parts[0] === module && parts[2] === action;
    });
  }, [isAuthenticated, isInitializing, permissions, module, action]);

  // Loading state
  if (isInitializing || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8B1C2D] border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show login prompt
  if (!isAuthenticated) {
    return (
      <LoginPageWrapper />
    );
  }

  // Authenticated but missing permission
  if (module && action && !authorized) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex max-w-md flex-col items-center gap-6 text-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Accès refusé</h1>
            <p className="text-muted-foreground">
              Vous n'avez pas la permission d'accéder à cette ressource.
              Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm">
            <Shield className="h-4 w-4 text-[#8B1C2D]" />
            <span className="font-medium">
              Permission requise : <code className="text-xs bg-muted-foreground/10 px-1.5 py-0.5 rounded">{module}.{action}</code>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
}

/**
 * Wrapper that shows login UI when not authenticated.
 * This delegates to the LoginPage component.
 */
function LoginPageWrapper() {
  const { login, verify2FA, loginError, clearError, isLoading, requires2FA } = useAuthStore();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#8B1C2D]/10">
          <LogIn className="h-10 w-10 text-[#8B1C2D]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Session expirée</h1>
          <p className="text-muted-foreground">
            Votre session a expiré. Veuillez vous reconnecter.
          </p>
        </div>
        <Button
          onClick={() => {
            clearError();
            useAuthStore.setState({ requires2FA: false, pending2FA: null });
          }}
          className="bg-[#8B1C2D] hover:bg-[#6B1522] text-white px-8"
        >
          Se connecter
        </Button>
      </div>
    </div>
  );
}
