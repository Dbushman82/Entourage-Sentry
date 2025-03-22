import { ReactNode } from "react";
import { Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  children: ReactNode;
  requiredRole?: string | string[];
}

/**
 * A protected route component that requires authentication
 * Can optionally require specific roles
 */
export function ProtectedRoute({ path, children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  const hasRequiredRole = () => {
    if (!requiredRole || !user) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    return user.role === requiredRole;
  };

  return (
    <Route path={path}>
      {() => {
        // Show loading indicator while checking auth
        if (isLoading) {
          return (
            <div className="flex min-h-screen items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          );
        }
        
        // Redirect to auth page if not authenticated
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        // Redirect to dashboard if missing required role
        if (requiredRole && !hasRequiredRole()) {
          return <Redirect to="/dashboard" />;
        }
        
        // Render the children if authenticated and authorized
        return <>{children}</>;
      }}
    </Route>
  );
}