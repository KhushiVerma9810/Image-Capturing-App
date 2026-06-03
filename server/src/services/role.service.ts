import { RoleModel } from "../models/Role.js";
import { PermissionModel } from "../models/Permission.js";
import { AppError } from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import type { CreateRoleInput, ListRolesQuery } from "../schemas/role.schema.js";

export async function seedRoles(seedUserId?: string) {
  const defaults = [
    {
      name: "Admin",
      label: "Admin",
      description: "Administrative access",
      permissions: [
        "view_dashboard",
        "manage_users",
        "manage_roles",
        "manage_permissions",
        "upload_images",
        "view_images",
        "delete_images",
      ],
      isSystem: true,
      isVisible: true,
    },
    {
      name: "Supervisor",
      label: "Supervisor",
      description: "Can manage workers and review activity",
      permissions: ["view_dashboard", "upload_images", "view_images"],
      isSystem: true,
      isVisible: true,
    },
    {
      name: "Worker",
      label: "Worker",
      description: "Can capture images and view own records",
      permissions: ["upload_images", "view_images"],
      isSystem: true,
      isVisible: true,
    },
  ] as const;

  for (const role of defaults) {
    // $set (not $setOnInsert) so the canonical definition — especially the
    // permission list — is repaired on every boot for roles that already
    // exist. These system roles are owned by the seed, not editable via the UI.
    await RoleModel.updateOne(
      { name: role.name },
      {
        $set: {
          label: role.label,
          description: role.description,
          permissions: role.permissions,
          isSystem: role.isSystem,
          isVisible: role.isVisible,
        },
        $setOnInsert: {
          createdBy: seedUserId ? toObjectId(seedUserId, "Seeder id") : null,
        },
      },
      { upsert: true },
    );
  }
}

export async function listRoles(
  params: ListRolesQuery & { includeHidden?: boolean },
) {
  const query: Record<string, unknown> = {};
  if (params.search?.trim()) {
    const search = params.search.trim();
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { label: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (!params.includeHidden) {
    query.isVisible = true;
  }

  const [total, roles] = await Promise.all([
    RoleModel.countDocuments(query),
    RoleModel.find(query)
      .sort({ isSystem: -1, createdAt: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit)
      .lean(),
  ]);

  return {
    roles: roles.map(toRoleResponse),
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export async function listAssignableRoles() {
  const roles = await RoleModel.find({ isVisible: true })
    .sort({ isSystem: -1, createdAt: 1 })
    .lean();
  return roles.map((role) => ({
    name: role.name,
    label: role.label,
    description: role.description,
    permissions: role.permissions ?? [],
    isSystem: role.isSystem,
  }));
}

export async function createRole(payload: CreateRoleInput, createdBy: string) {
  const exists = await RoleModel.findOne({ name: payload.name });
  if (exists) {
    throw new AppError(409, "Role already exists");
  }

  const permissions = payload.permissions
    ? await resolvePermissions(payload.permissions)
    : [];

  const role = await RoleModel.create({
    name: payload.name,
    label: payload.label,
    description: payload.description,
    permissions,
    isSystem: false,
    isVisible: true,
    createdBy: toObjectId(createdBy, "Creator id"),
  });

  return toRoleResponse(role);
}

/** Validates that every permission name exists and is visible. */
async function resolvePermissions(input: string[]) {
  const names = input
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!names.length) {
    return [];
  }

  const permissions = await PermissionModel.find({
    name: { $in: names },
    isVisible: true,
  }).lean();
  const missing = names.filter(
    (name) => !permissions.some((permission) => permission.name === name),
  );
  if (missing.length > 0) {
    throw new AppError(400, `Unknown permission names: ${missing.join(", ")}`);
  }

  return [...new Set(permissions.map((permission) => permission.name))];
}

type RoleLike = {
  _id: { toString(): string };
  name: string;
  label: string;
  description: string;
  permissions?: string[];
  isSystem: boolean;
  isVisible: boolean;
  createdAt?: Date;
};

function toRoleResponse(role: RoleLike) {
  return {
    id: role._id.toString(),
    name: role.name,
    label: role.label,
    description: role.description,
    permissions: role.permissions ?? [],
    isSystem: role.isSystem,
    isVisible: role.isVisible,
    createdAt: role.createdAt,
  };
}
