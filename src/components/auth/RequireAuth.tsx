import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }

  return <>{children}</>;
}