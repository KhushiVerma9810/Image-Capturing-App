import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { App } from "./App";
import "./styles.css";

function RootRedirect() {
  const { user, isReady, can } = useAuth();

  if (!isReady) {
    return <div className="page-loader">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Land on the dashboard when the role can see it (Admin, Supervisor),
  // otherwise go straight to the capture workspace (Worker).
  return <Navigate to={can("view_dashboard") ? "/dashboard" : "/capture"} replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
