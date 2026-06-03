import { UserModel } from "../models/User.js";
import { RoleModel } from "../models/Role.js";
import { AppError } from "../utils/app-error.js";
import { hashPassword } from "./password.service.js";
import { deleteImagesForUser } from "./image.service.js";
import { toPublicUser } from "../utils/public-user.js";
import { toObjectId } from "../utils/object-id.js";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from "../schemas/user.schema.js";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildUserQuery(params: ListUsersQuery) {
  const conditions: Record<string, unknown>[] = [];

  if (params.search?.trim()) {
    const search = params.search.trim();
    conditions.push({
      $or: [
        { username: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ],
    });
  }

  if (params.role) {
    // Exact role match, case-insensitive (stored role casing can vary).
    conditions.push({
      role: { $regex: `^${escapeRegExp(params.role)}$`, $options: "i" },
    });
  }

  if (params.status) {
    conditions.push({ active: params.status === "active" });
  }

  return conditions.length ? { $and: conditions } : {};
}

async function assertAssignableRole(roleName: string) {
  const role = await RoleModel.findOne({ name: roleName, isVisible: true });
  if (!role) {
    throw new AppError(400, "Selected role is not assignable");
  }
}

export async function createUser(payload: CreateUserInput, createdBy: string) {
  await assertAssignableRole(payload.role);

  const existing = await UserModel.findOne({ username: payload.username });
  if (existing) {
    throw new AppError(409, "Username already exists");
  }

  const user = await UserModel.create({
    username: payload.username,
    passwordHash: await hashPassword(payload.password),
    role: payload.role,
    active: true,
    createdBy: toObjectId(createdBy, "Creator id"),
  });

  return toPublicUser(user);
}

export async function listUsers(params: ListUsersQuery) {
  const query = buildUserQuery(params);
  const [total, users] = await Promise.all([
    UserModel.countDocuments(query),
    UserModel.find(query)
      .sort({ createdAt: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit),
  ]);

  return {
    users: users.map((user) => toPublicUser(user)),
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export async function updateUser(
  userId: string,
  payload: UpdateUserInput,
  actingUserId: string,
) {
  const user = await UserModel.findById(toObjectId(userId, "User id"));
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (
    userId === actingUserId &&
    (payload.role || typeof payload.active === "boolean")
  ) {
    throw new AppError(400, "You cannot change your own role or status");
  }

  if (payload.role) {
    await assertAssignableRole(payload.role);
    user.role = payload.role;
  }

  if (typeof payload.active === "boolean") {
    user.active = payload.active;
  }

  if (payload.password) {
    user.passwordHash = await hashPassword(payload.password);
  }

  await user.save();
  return toPublicUser(user);
}

export async function deleteUser(userId: string, actingUserId: string) {
  toObjectId(userId, "User id");
  toObjectId(actingUserId, "Actor id");

  if (userId === actingUserId) {
    throw new AppError(400, "You cannot delete your own account");
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Cascade: remove the user's captured images (files + records) before the
  // account itself so we never leave orphaned uploads on disk.
  await deleteImagesForUser(userId);
  await user.deleteOne();

  return { id: userId };
}
