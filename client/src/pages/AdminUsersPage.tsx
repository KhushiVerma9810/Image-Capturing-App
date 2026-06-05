import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  createUser,
  deleteUser,
  fetchDashboardSummary,
  listAssignableRoles,
  listUsers,
  updateUser,
} from "../api";
import { useAuth } from "../auth/AuthContext";
import { useShell } from "../components/AppShell";
import { PencilIcon, TrashIcon, UserPlusIcon } from "../components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { PublicUser, RoleDefinition } from "../types";

type DialogMode = "create" | "edit" | null;

const pageSize = 10;

type ConfirmDelete = { id: string; username: string } | null;

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { searchQuery } = useShell();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [summary, setSummary] = useState<{
    visibleUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    activeWorkers: number;
    adminRoles: number;
  } | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: pageSize,
    totalPages: 1,
  });
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("Worker");
  const [active, setActive] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">(
    "",
  );
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete>(null);

  async function loadUsers(nextPage = page) {
    const response = await listUsers({
      page: nextPage,
      limit: pageSize,
      search: searchQuery.trim() || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    });
    setUsers(response.users);
    setPagination(response.pagination);
    setPage(response.pagination.page);
  }

  useEffect(() => {
    let alive = true;
    listAssignableRoles()
      .then((response) => {
        if (alive) setRoles(response.roles);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [userResponse, summaryResponse] = await Promise.all([
          listUsers({
            page: 1,
            limit: pageSize,
            search: searchQuery.trim() || undefined,
            role: roleFilter || undefined,
            status: statusFilter || undefined,
          }),
          fetchDashboardSummary(searchQuery.trim() || undefined),
        ]);
        if (!alive) return;
        setUsers(userResponse.users);
        setPagination(userResponse.pagination);
        setPage(userResponse.pagination.page);
        setSummary({
          visibleUsers: summaryResponse.metrics.visibleUsers,
          activeUsers: summaryResponse.metrics.activeUsers,
          inactiveUsers: summaryResponse.metrics.inactiveUsers,
          activeWorkers: summaryResponse.metrics.activeWorkers,
          adminRoles: summaryResponse.metrics.adminRoles,
        });
      } catch (loadError) {
        if (!alive) return;
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "Unable to load users.",
        );
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [searchQuery, roleFilter, statusFilter]);

  const totalUsers = summary?.visibleUsers ?? pagination.total;
  const activeUsers = summary?.activeUsers ?? 0;
  const inactiveUsers = summary?.inactiveUsers ?? 0;
  const adminRoles = summary?.adminRoles ?? 0;

  const pageUsers = users;

  async function refreshSummary() {
    try {
      const response = await fetchDashboardSummary(
        searchQuery.trim() || undefined,
      );
      setSummary({
        visibleUsers: response.metrics.visibleUsers,
        activeUsers: response.metrics.activeUsers,
        inactiveUsers: response.metrics.inactiveUsers,
        activeWorkers: response.metrics.activeWorkers,
        adminRoles: response.metrics.adminRoles,
      });
    } catch {
      // Non-critical
    }
  }

  function validateUserForm(): string | null {
    if (username.trim().length < 3) {
      return "Username must be at least 3 characters.";
    }
    if (dialogMode === "create" && password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (dialogMode === "edit" && password.length > 0 && password.length < 8) {
      return "New password must be at least 8 characters.";
    }
    if (!role) {
      return "Please select a role.";
    }
    return null;
  }

  function openCreateDialog() {
    setError(null);
    setStatus(null);
    setDialogMode("create");
    setEditingUser(null);
    setUsername("");
    setPassword("");
    const worker = roles.find(
      (option) => option.name.toLowerCase() === "worker",
    );
    setRole(worker?.name ?? roles[roles.length - 1]?.name ?? "worker");
    setActive(true);
  }

  function openEditDialog(userToEdit: PublicUser) {
    setError(null);
    setStatus(null);
    setDialogMode("edit");
    setEditingUser(userToEdit);
    setUsername(userToEdit.username);
    setPassword("");
    const current = roles.find(
      (option) => option.name.toLowerCase() === userToEdit.role.toLowerCase(),
    );
    setRole(current?.name ?? userToEdit.role);
    setActive(userToEdit.active);
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingUser(null);
    setError(null);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const validationError = validateUserForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    try {
      await createUser({ username: username.trim(), password, role });
      closeDialog();
      setStatus("User created.");
      await Promise.all([loadUsers(1), refreshSummary()]);
    } catch (createError) {
      setError(
        createError instanceof ApiError
          ? createError.message
          : "Failed to create user.",
      );
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    setStatus(null);

    const validationError = validateUserForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    try {
      await updateUser(editingUser.id, {
        role,
        active,
        ...(password.trim() ? { password } : {}),
      });
      closeDialog();
      setStatus("User updated.");
      await Promise.all([loadUsers(page), refreshSummary()]);
    } catch (updateError) {
      setError(
        updateError instanceof ApiError
          ? updateError.message
          : "Failed to update user.",
      );
    }
  }

  async function handleToggleActive(userToToggle: PublicUser) {
    const nextActive = !userToToggle.active;
    setSavingId(userToToggle.id);
    try {
      await updateUser(userToToggle.id, { active: nextActive });
      await Promise.all([loadUsers(page), refreshSummary()]);
      setStatus(
        nextActive
          ? `${userToToggle.username} is now active and can sign in.`
          : `${userToToggle.username} has been disabled and can no longer sign in.`,
      );
      setError(null);
    } catch (updateError) {
      setError(
        updateError instanceof ApiError
          ? updateError.message
          : "Failed to update user.",
      );
    } finally {
      setSavingId(null);
    }
  }

  function requestDelete(userId: string, username: string) {
    setConfirmDelete({ id: userId, username });
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { id: userId } = confirmDelete;
    setConfirmDelete(null);
    setSavingId(userId);
    try {
      await deleteUser(userId);
      setStatus("User deleted.");
      setError(null);
      await Promise.all([loadUsers(Math.max(1, page)), refreshSummary()]);
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError
          ? deleteError.message
          : "Failed to delete user.",
      );
    } finally {
      setSavingId(null);
    }
  }

  const roleBadgeVariant = (r: string): "default" | "secondary" | "outline" => {
    const lower = r.toLowerCase();
    if (lower === "admin") return "default";
    if (lower === "supervisor") return "secondary";
    return "outline";
  };

  const getRoleDef = (roleName: string) =>
    roles.find((r) => r.name.toLowerCase() === roleName.toLowerCase());

  return (
    <div className="users-page">
      <div className="page-title-row">
        <div>
          <h2>User Management</h2>
          <p>
            Manage organization members, assign roles, and audit system access.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <UserPlusIcon className="ui-icon" />
          <span>Create New User</span>
        </Button>
      </div>

      <section className="metric-grid users-metrics">
        <article className="metric-card">
          <div>
            <span className="metric-label">Total Users</span>
            <strong>{totalUsers.toLocaleString()}</strong>
            <small className="metric-subtle">Live from server</small>
          </div>
        </article>

        <article className="metric-card">
          <div>
            <span className="metric-label">Active Sessions</span>
            <strong>{activeUsers.toLocaleString()}</strong>
            <div className="progress">
              <span
                style={{
                  width: `${Math.min(100, totalUsers ? (activeUsers / totalUsers) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>
        </article>

        <article className="metric-card">
          <div>
            <span className="metric-label">Admin Roles</span>
            <strong>{adminRoles.toLocaleString()}</strong>
            <small className="metric-subtle">High privilege accounts</small>
          </div>
        </article>

        <article className="metric-card">
          <div>
            <span className="metric-label">Inactive Users</span>
            <strong>{inactiveUsers.toLocaleString()}</strong>
            <small className="metric-subtle">Disabled accounts</small>
          </div>
        </article>
      </section>

      <section className="panel users-table-panel">
        <div className="table-toolbar">
          <div className="toolbar-group">
            <div className="select-shell filter-select">
              <select
                className="text-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
              >
                <option value="">All Roles</option>
                {roles.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="select-shell filter-select">
              <select
                className="text-select"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "" | "active" | "inactive")
                }
                aria-label="Filter by status"
              >
                <option value="">Any Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <p className="toolbar-copy">
            Showing {pageUsers.length} of {pagination.total.toLocaleString()}{" "}
            users
          </p>
        </div>

        <div className="table-card">
          <div className="table-head">
            <span>Name</span>
            <span>Email Address</span>
            <span>Role</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="table-body">
            {pageUsers.length === 0 ? (
              <div className="table-empty">
                <p>No users match your filters.</p>
              </div>
            ) : (
              pageUsers.map((userEntry) => (
                <div className="table-row" key={userEntry.id}>
                  <div className="row-person">
                    <div className="avatar">
                      {userEntry.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong>{userEntry.username}</strong>
                      <span>{`${userEntry.username}@enterprise.co`}</span>
                    </div>
                  </div>

                  <span className="cell-muted">{`${userEntry.username}@enterprise.co`}</span>

                  <div className="role-pill-wrap">
                    <Badge
                      variant={roleBadgeVariant(userEntry.role)}
                      className="text-xs font-bold tracking-wide uppercase px-3 py-0.5 h-auto rounded-full"
                    >
                      {getRoleDef(userEntry.role)?.label ??
                        userEntry.role.toUpperCase()}
                    </Badge>
                    {getRoleDef(userEntry.role)?.isSystem === false && (
                      <Badge
                        variant="secondary"
                        className="text-xs tracking-wide uppercase px-2 py-0.5 h-auto rounded-full ml-1 opacity-70"
                      >
                        CUSTOM
                      </Badge>
                    )}
                  </div>

                  <div className="status-pill-wrap">
                    <button
                      className={`toggle toggle-sm ${userEntry.active ? "on" : ""}`}
                      type="button"
                      onClick={() => handleToggleActive(userEntry)}
                      disabled={
                        savingId === userEntry.id ||
                        userEntry.id === currentUser?.id
                      }
                      title={
                        userEntry.id === currentUser?.id
                          ? "You can't change your own status"
                          : userEntry.active
                            ? "Disable account"
                            : "Enable account"
                      }
                      aria-label={
                        userEntry.active
                          ? `Disable ${userEntry.username}`
                          : `Enable ${userEntry.username}`
                      }
                    >
                      <span className="toggle-knob" />
                    </button>
                    <span
                      className={`status-label ${userEntry.active ? "active" : "inactive"}`}
                    >
                      {userEntry.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="row-actions">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(userEntry)}
                      disabled={
                        savingId === userEntry.id ||
                        userEntry.id === currentUser?.id
                      }
                      title="Edit user"
                      className="action-button"
                    >
                      <PencilIcon className="ui-icon" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        requestDelete(userEntry.id, userEntry.username)
                      }
                      disabled={
                        savingId === userEntry.id ||
                        userEntry.id === currentUser?.id
                      }
                      title="Delete user"
                      className="action-button text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="ui-icon" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pagination-row">
            <button
              className="pagination-link"
              type="button"
              onClick={() => loadUsers(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <div className="pagination-pages">
              <button className="page-chip active" type="button">
                {page}
              </button>
              <span>of {pagination.totalPages}</span>
            </div>
            <button
              className="pagination-link"
              type="button"
              onClick={() =>
                loadUsers(Math.min(pagination.totalPages, page + 1))
              }
              disabled={page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="info-banner">
        <div className="info-badge">i</div>
        <div>
          <h3>Administrative Audit Active</h3>
          <p>
            All changes to user roles and access status are logged and
            timestamped for security compliance. Recent logs are available in
            the Dashboard section.
          </p>
        </div>
      </section>

      {status && <div className="status-banner success">{status}</div>}
      {!dialogMode && error && (
        <div className="status-banner error">{error}</div>
      )}

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[420px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Permanently delete <strong>{confirmDelete?.username}</strong> and
              all of their captured images? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="modal-actions border-0 bg-transparent p-0 m-0">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!dialogMode}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-[760px]" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-5">
              <div>
                <DialogTitle>
                  {dialogMode === "create" ? "Create New User" : "Edit User"}
                </DialogTitle>
                <DialogDescription>
                  {dialogMode === "create"
                    ? "Add a new member to your organization team."
                    : "Update the selected account."}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon-sm" className="close-button">
                  ×
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <form
            className="modal-form"
            onSubmit={dialogMode === "create" ? handleCreate : handleEdit}
          >
            <label className="field">
              <span className="field-label">Username</span>
              <Input
                placeholder="e.g. alexander.p@company.com"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={dialogMode === "edit"}
                className="text-input h-auto"
              />
            </label>

            <label className="field">
              <span className="field-label">
                {dialogMode === "create"
                  ? "Temporary Password"
                  : "New Password"}
              </span>
              <Input
                placeholder="Enter a secure password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="text-input h-auto"
              />
            </label>

            <label className="field">
              <span className="field-label">Role Selection</span>
              <div className="select-shell">
                <select
                  className="text-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {roles.map((option) => (
                    <option key={option.name} value={option.name}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="toggle-row">
              <button
                className={`toggle ${active ? "on" : ""}`}
                type="button"
                onClick={() => setActive((v) => !v)}
              >
                <span className="toggle-knob" />
              </button>
              <div>
                <strong>Account status</strong>
                <p>Disable or re-enable the account without deleting it.</p>
              </div>
            </div>

            {error && <div className="status-banner error">{error}</div>}

            <DialogFooter className="modal-actions border-0 bg-transparent p-0 m-0">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">
                {dialogMode === "create" ? "Create User" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
