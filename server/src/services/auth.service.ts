import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserModel } from "../models/User.js";
import { RoleModel } from "../models/Role.js";
import { AppError } from "../utils/app-error.js";
import { toPublicUser } from "../utils/public-user.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import { seedPermissions } from "./permission.service.js";
import { seedRoles } from "./role.service.js";
import type { LoginInput } from "../schemas/auth.schema.js";

/**
 * Builds the user object returned to an authenticated client, including the
 * permissions granted by their role. The frontend uses these to decide which
 * routes/UI to show, mirroring the permission checks the API enforces.
 */
export async function buildAuthUser(user: Parameters<typeof toPublicUser>[0]) {
  const publicUser = toPublicUser(user);
  const role = await RoleModel.findOne({ name: publicUser.role }).lean();
  return { ...publicUser, permissions: role?.permissions ?? [] };
}

async function seedAccount(params: {
  username: string;
  password: string;
  role: string;
}) {
  const username = params.username.trim().toLowerCase();
  const existing = await UserModel.findOne({ username });
  if (existing) {
    return;
  }

  const passwordHash = await hashPassword(params.password);
  await UserModel.create({
    username,
    passwordHash,
    role: params.role,
    active: true,
  });
}

/** Seeds the permissions, system roles, and default admin account on boot. */
export async function seedSystemData() {
  await seedPermissions();
  await seedRoles();
  await seedAccount({
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD,
    role: "Admin",
  });
}

export async function login(credentials: LoginInput) {
  const user = await UserModel.findOne({ username: credentials.username });
  if (!user) {
    throw new AppError(401, "Invalid username or password");
  }

  const isValid = await verifyPassword(
    credentials.password,
    user.passwordHash as string,
  );
  if (!isValid) {
    throw new AppError(401, "Invalid username or password");
  }

  if (!user.active) {
    throw new AppError(
      403,
      "Your account has been disabled. Please contact your administrator.",
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: "8h" },
  );

  return {
    token,
    user: await buildAuthUser(user),
  };
}
