import { z } from "zod";
import { listQuerySchema } from "./common.schema.js";

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(40, "Role name must be at most 40 characters"),
  label: z
    .string()
    .trim()
    .min(2, "Display label must be at least 2 characters")
    .max(60, "Display label must be at most 60 characters"),
  description: z
    .string()
    .trim()
    .min(4, "Description must be at least 4 characters")
    .max(140, "Description must be at most 140 characters"),
  permissions: z.array(z.string().trim().min(2)).optional(),
});

export const listRolesQuery = listQuerySchema({ defaultLimit: 10 });

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type ListRolesQuery = z.infer<typeof listRolesQuery>;
