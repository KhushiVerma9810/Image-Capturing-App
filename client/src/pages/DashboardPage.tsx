import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, fetchDashboardSummary } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useShell } from "../components/AppShell";
import { CameraButtonIcon, ImageIcon, ShieldIcon, UserPlusIcon, UsersIcon } from "../components/icons";
import type { DashboardSummary } from "../types";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { searchQuery } = useShell();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const response = await fetchDashboardSummary(searchQuery.trim() || undefined);
        if (alive) {
          setSummary(response);
        }
      } catch (loadError) {
        if (!alive) return;
        if (loadError instanceof ApiError) {
          setError(loadError.message);
        } else {
          setError("Unable to load dashboard data.");
        }
      }
    }

    void load();

    return () => {
      alive = false;
    };
  }, [searchQuery]);

  const metrics = summary?.metrics ?? {
    visibleUsers: 0,
    activeWorkers: 0,
    capturedImages: 0
  };

  const chart = useMemo(() => summary?.chart ?? [], [summary]);

  const activity = useMemo(() => {
    const userEvents =
      summary?.recentUsers.map((entry) => ({
        kind: "user" as const,
        label: `${entry.role} account updated`,
        detail: entry.username,
        time: new Date(entry.updatedAt).toLocaleString(),
        tone: "mint" as const
      })) ?? [];

    const imageEvents =
      summary?.recentImages.map((entry) => ({
        kind: "image" as const,
        label: "Image captured",
        detail: `${entry.username} · ${entry.role}`,
        time: new Date(entry.createdAt).toLocaleString(),
        tone: "amber" as const
      })) ?? [];

    return [...userEvents, ...imageEvents].slice(0, 3);
  }, [summary]);

  return (
    <div className="dashboard-page">
      <section className="hero-card">
        <div className="hero-copy">
          <h2>Welcome {isAdmin ? "Admin" : "Back"}</h2>
          <p>
            {isAdmin
              ? "You are managing roles, users, and the full system."
              : "System performance is optimal."}
          </p>
        </div>
        <div className="hero-art">
          <ShieldIcon className="ui-icon hero-shield" />
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card metric-blue">
          <div>
            <span className="metric-label">TOTAL USERS</span>
            <strong>{metrics.visibleUsers.toLocaleString()}</strong>
          </div>
          <div className="metric-icon metric-icon-blue">
            <UsersIcon className="ui-icon" />
          </div>
        </article>

        <article className="metric-card metric-teal">
          <div>
            <span className="metric-label">ACTIVE WORKERS</span>
            <strong>{metrics.activeWorkers.toLocaleString()}</strong>
          </div>
          <div className="metric-icon metric-icon-teal">
            <UserPlusIcon className="ui-icon" />
          </div>
        </article>

        <article className="metric-card metric-amber">
          <div>
            <span className="metric-label">CAPTURED IMAGES</span>
            <strong>{metrics.capturedImages.toLocaleString()}</strong>
          </div>
          <div className="metric-icon metric-icon-amber">
            <ImageIcon className="ui-icon" />
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel graph-panel">
          <div className="panel-head">
            <h3>User Overview</h3>
            <span className="panel-kicker">Images per Day</span>
          </div>

          <div className="bar-chart" aria-label="Images per day chart">
            {chart.map((item) => (
              <div className="bar-group" key={item.label}>
                <div className="bar" style={{ height: `${Math.max(18, Math.min(100, item.value * 12))}%` }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel activity-panel">
          <div className="panel-head">
            <h3>Recent Activity</h3>
          </div>

          <div className="activity-list">
            {activity.length === 0 ? (
              <p className="empty-copy">No recent activity matches your search.</p>
            ) : (
              activity.map((entry) => (
                <div className="activity-item" key={`${entry.kind}-${entry.detail}-${entry.time}`}>
                  <div className={`activity-badge ${entry.tone}`}>
                    {entry.kind === "user" ? <UsersIcon className="ui-icon" /> : <CameraButtonIcon className="ui-icon" />}
                  </div>
                  <div className="activity-copy">
                    <p>{entry.label}</p>
                    <strong>{entry.detail}</strong>
                    <span>{entry.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="capture-cta">
        <div className="capture-cta-preview" />
        <div className="capture-cta-copy">
          <h3>Ready for Capture</h3>
          <p>Camera 01: Active | Device Status: Online</p>
        </div>
        <button className="primary-button capture-launch" type="button" onClick={() => navigate("/capture")}>
          <CameraButtonIcon className="ui-icon" />
          <span>Launch Camera Interface</span>
        </button>
      </section>

      {error && <div className="status-banner error dashboard-error">{error}</div>}
    </div>
  );
}
