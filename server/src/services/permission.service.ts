import { PermissionModel } from "../models/Permission.js";
import { AppError } from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import type {
  CreatePermissionInput,
  ListPermissionsQuery,
} from "../schemas/permission.schema.js";

export async function seedPermissions(seedUserId?: string) {
  const defaults = [
    {
      name: "view_dashboard",
      label: "View Dashboard",
      description: "View dashboard metrics and reports",
      isSystem: true,
      isVisible: true,
    },
    {
      name: "manage_users",
      label: "Manage Users",
      description: "Create, update, and remove users",
      isSystem: true,
      isVisible: true,
    },
    {
      name: "manage_roles",
      label: "Manage Roles",
      description: "Create and update role definitions",
      isSystem: true,
      isVisible: true,
    },
    {
      name: "manage_permissions",
      label: "Manage Permissions",
      description: "Create and assign permissions to roles",
      isSystem: true,
      isVisible: true,
    },
    {
      name: "upload_images",
      label: "Upload Images",
      description: "Upload and manage captured image assets",
      isSystem: true,
      isVisible: true,
    },
    {
      name: "view_images",
      label: "View Images",
      description: "View captured images and download files",
      isSystem: true,
      isVisible: true,
    },
    {
      name: "delete_images",
      label: "Delete Images",
      description: "Delete captured images from the system",
      isSystem: true,
      isVisible: true,
    },
  ] as const;

  for (const permission of defaults) {
    await PermissionModel.updateOne(
      { name: permission.name },
      {
        $setOnInsert: {
          ...permission,
          createdBy: seedUserId ? toObjectId(seedUserId, "Seeder id") : null,
        },
      },
      { upsert: true },
    );
  }
}

export async function listPermissions(
  params: ListPermissionsQuery & { includeHidden?: boolean },
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

  const [total, permissions] = await Promise.all([
    PermissionModel.countDocuments(query),
    PermissionModel.find(query)
      .sort({ isSystem: -1, createdAt: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit)
      .lean(),
  ]);

  return {
    permissions: permissions.map((permission) => ({
      id: permission._id.toString(),
      name: permission.name,
      label: permission.label,
      description: permission.description,
      isSystem: permission.isSystem,
      isVisible: permission.isVisible,
      createdAt: permission.createdAt,
    })),
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export async function createPermission(
  payload: CreatePermissionInput,
  createdBy: string,
) {
  const exists = await PermissionModel.findOne({ name: payload.name });
  if (exists) {
    throw new AppError(409, "Permission already exists");
  }

  const permission = await PermissionModel.create({
    name: payload.name,
    label: payload.label,
    description: payload.description,
    isSystem: false,
    isVisible: true,
    createdBy: toObjectId(createdBy, "Creator id"),
  });

  return {
    id: permission._id.toString(),
    name: permission.name,
    label: permission.label,
    description: permission.description,
    isSystem: permission.isSystem,
    isVisible: permission.isVisible,
    createdAt: permission.createdAt,
  };
}
