import { z } from "zod";
import { listQuerySchema, searchParam } from "./common.schema.js";

const roleName = z
  .string()
  .trim()
  .min(2, "Please select a role")
  .max(40, "Role name is too long");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters");

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .transform((value) => value.toLowerCase()),
  password,
  role: roleName,
});

export const updateUserSchema = z.object({
  role: roleName.optional(),
  password: password.optional(),
  active: z.boolean().optional(),
});

export const listUsersQuery = listQuerySchema({ defaultLimit: 10 }).extend({
  role: searchParam,
  status: z.preprocess(
    (value) => (value === "active" || value === "inactive" ? value : undefined),
    z.enum(["active", "inactive"]).optional(),
  ),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuery>;
