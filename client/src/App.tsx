import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { CapturePage } from "./pages/CapturePage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RolesPage } from "./pages/RolesPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function HomeRedirect() {
  const { can } = useAuth();
  return <Navigate to={can("view_dashboard") ? "/dashboard" : "/capture"} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requirePermission="view_dashboard">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute requirePermission="manage_users">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="roles"
          element={
            <ProtectedRoute requirePermission="manage_roles">
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route path="capture" element={<CapturePage />} />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute requirePermission="manage_users">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
