import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function ProtectedRoute({
  children,
  requirePermission,
}: {
  children: JSX.Element;
  requirePermission?: string;
}) {
  const { user, isReady, can } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <div className="page-loader">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requirePermission && !can(requirePermission)) {
    return <Navigate to="/capture" replace />;
  }

  return children;
}
