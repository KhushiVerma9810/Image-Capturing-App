import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { CameraIcon, GridIcon, HelpIcon, LogoutIcon, SearchIcon, SettingsIcon, UsersIcon } from "./icons";

type ShellContextValue = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

const ShellContext = createContext<ShellContextValue | undefined>(undefined);

export function useShell() {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error("useShell must be used within AppShell");
  }

  return context;
}

function getSearchPlaceholder(pathname: string) {
  if (pathname.startsWith("/capture")) {
    return "Search captures...";
  }
  if (pathname.startsWith("/users") || pathname.startsWith("/admin/users")) {
    return "Search users...";
  }
  if (pathname.startsWith("/roles")) {
    return "Search roles...";
  }

  return "Search system...";
}

function ShellNavLink({
  to,
  icon,
  label
}: {
  to: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
      end={to === "/dashboard"}
    >
      <span className="sidebar-link-icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { logout, can } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const shellValue = useMemo(() => ({ searchQuery, setSearchQuery }), [searchQuery]);
  const placeholder = getSearchPlaceholder(location.pathname);

  return (
    <ShellContext.Provider value={shellValue}>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-block">
            <div>
              <h1>Enterprise Admin</h1>
              <p>Management Portal</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {can("view_dashboard") && (
              <ShellNavLink to="/dashboard" icon={<GridIcon />} label="Dashboard" />
            )}
            {can("manage_users") && (
              <ShellNavLink to="/users" icon={<UsersIcon />} label="User Management" />
            )}
            <ShellNavLink to="/capture" icon={<CameraIcon />} label="Image Capture" />
            {can("manage_roles") && (
              <ShellNavLink to="/roles" icon={<UsersIcon />} label="Roles" />
            )}
          </nav>

          <div className="sidebar-spacer" />

          <div className="sidebar-footer">
            <button className="sidebar-footer-item" type="button">
              <SettingsIcon className="ui-icon" />
              <span>Profile Settings</span>
            </button>
            <button className="sidebar-footer-item" type="button">
              <HelpIcon className="ui-icon" />
              <span>Support</span>
            </button>
          </div>
        </aside>

        <div className="workspace-shell">
          <header className="topbar">
            <div className="search-shell">
              <SearchIcon className="ui-icon search-icon" />
              <input
                aria-label={placeholder}
                className="search-input"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <div className="topbar-system">
              <span>User Management System</span>
            </div>

            <button className="signout-button" onClick={logout} type="button">
              <span>Sign Out</span>
              <LogoutIcon className="ui-icon" />
            </button>
          </header>

          <main className="page-shell">
            <Outlet />
          </main>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
