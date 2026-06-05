import { FormEvent, useEffect, useState } from "react";
import { ApiError, createRole, listPermissions, listRoles } from "../api";
import { useShell } from "../components/AppShell";
import { UserPlusIcon } from "../components/icons";
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
import type { RoleDefinition } from "../types";

type PermissionOption = { name: string; label: string };

const pageSize = 10;

export function RolesPage() {
  const { searchQuery } = useShell();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [permissionOptions, setPermissionOptions] = useState<PermissionOption[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  async function loadRoles(nextPage = page, nextSearch = searchQuery.trim()) {
    setLoading(true);
    try {
      const response = await listRoles({
        page: nextPage,
        limit: pageSize,
        search: nextSearch || undefined,
      });
      setRoles(response.roles);
      setTotalRoles(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setPage(response.pagination.page);
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : "Unable to load roles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoles(1, searchQuery.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const response = await listPermissions();
        if (alive) {
          setPermissionOptions(
            response.permissions.map((p) => ({ name: p.name, label: p.label })),
          );
        }
      } catch {
        // Non-critical
      }
    })();
    return () => { alive = false; };
  }, []);

  const visibleRoles = roles;

  function togglePermission(permissionName: string) {
    setSelectedPermissions((current) =>
      current.includes(permissionName)
        ? current.filter((v) => v !== permissionName)
        : [...current, permissionName],
    );
  }

  function openDialog() {
    setError(null);
    setStatus(null);
    setName("");
    setLabel("");
    setDescription("");
    setSelectedPermissions([]);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setError(null);
    setStatus(null);
  }

  function validateRoleForm(): string | null {
    if (name.trim().length < 2) return "Role name must be at least 2 characters.";
    if (description.trim().length < 4) return "Description must be at least 4 characters.";
    return null;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const validationError = validateRoleForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    try {
      await createRole({
        name: name.trim(),
        label: label.trim() || name.trim(),
        description: description.trim(),
        permissions: selectedPermissions,
      });
      setDialogOpen(false);
      setStatus("Role created.");
      await loadRoles(1, searchQuery.trim());
    } catch (createError) {
      setError(
        createError instanceof ApiError ? createError.message : "Failed to create role.",
      );
    }
  }

  return (
    <div className="roles-page">
      <div className="page-title-row">
        <div>
          <h2>Roles</h2>
          <p>
            Seeded roles are managed here. Admins can add custom roles when the
            business needs new access levels.
          </p>
        </div>
        <Button onClick={openDialog}>
          <UserPlusIcon className="ui-icon" />
          <span>Create Role</span>
        </Button>
      </div>

      <section className="panel users-table-panel">
        <div className="table-toolbar">
          <p className="toolbar-copy">
            {loading
              ? "Loading roles..."
              : `Showing ${visibleRoles.length} of ${totalRoles.toLocaleString()} roles`}
          </p>
        </div>

        <div className="table-card">
          <div className="table-head roles-head">
            <span>Name</span>
            <span>Label</span>
            <span>Description</span>
            <span>Permissions</span>
            <span>Type</span>
          </div>

          <div className="table-body">
            {loading ? (
              <div className="table-empty"><p>Loading...</p></div>
            ) : visibleRoles.length === 0 ? (
              <div className="table-empty"><p>No roles found.</p></div>
            ) : (
              visibleRoles.map((role) => (
                <div className="table-row roles-row" key={role.id}>
                  <strong>{role.name}</strong>
                  <span>{role.label}</span>
                  <span>{role.description}</span>
                  <span>
                    {role.permissions?.length
                      ? `${role.permissions.length} perm${role.permissions.length === 1 ? "" : "s"}`
                      : "None"}
                  </span>
                  <Badge
                    variant={role.isSystem ? "default" : "outline"}
                    className="text-xs font-bold tracking-wide uppercase px-3 h-auto rounded-full"
                  >
                    {role.isSystem ? "SYSTEM" : "CUSTOM"}
                  </Badge>
                </div>
              ))
            )}
          </div>

          <div className="pagination-row">
            <button
              className="pagination-link"
              type="button"
              onClick={() => loadRoles(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <div className="pagination-pages">
              <button className="page-chip active" type="button">{page}</button>
              <span>of {totalPages}</span>
            </div>
            <button
              className="pagination-link"
              type="button"
              onClick={() => loadRoles(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {status && <div className="status-banner success">{status}</div>}
      {!dialogOpen && error && <div className="status-banner error">{error}</div>}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-[760px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>Add a custom role for the organization.</DialogDescription>
          </DialogHeader>

          <form className="modal-form" onSubmit={handleCreate}>
            <label className="field">
              <span className="field-label">Role Name</span>
              <Input
                placeholder="e.g. auditor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-input h-auto"
              />
            </label>
            <label className="field">
              <span className="field-label">Display Label</span>
              <Input
                placeholder="e.g. Auditor"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="text-input h-auto"
              />
            </label>
            <label className="field">
              <span className="field-label">Description</span>
              <textarea
                className="text-input role-description"
                placeholder="Describe what the role can do"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="field">
              <span className="field-label">Permissions</span>
              <div className="permission-options">
                {permissionOptions.length === 0 ? (
                  <p className="empty-copy">No permissions available.</p>
                ) : (
                  permissionOptions.map((permission) => (
                    <label className="permission-option" key={permission.name}>
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.name)}
                        onChange={() => togglePermission(permission.name)}
                      />
                      <span>{permission.label}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {error && <div className="status-banner error">{error}</div>}

            <DialogFooter className="modal-actions border-0 bg-transparent p-0 m-0">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
