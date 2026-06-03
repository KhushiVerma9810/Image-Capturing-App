import { z } from "zod";
import { listQuerySchema } from "./common.schema.js";

export const createPermissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Permission name must be at least 2 characters")
    .max(40, "Permission name must be at most 40 characters")
    .transform((value) => value.toLowerCase().replace(/\s+/g, "_")),
  label: z
    .string()
    .trim()
    .min(2, "Label must be at least 2 characters")
    .max(60, "Label must be at most 60 characters"),
  description: z
    .string()
    .trim()
    .min(4, "Description must be at least 4 characters")
    .max(140, "Description must be at most 140 characters"),
});

export const listPermissionsQuery = listQuerySchema({ defaultLimit: 10 });

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type ListPermissionsQuery = z.infer<typeof listPermissionsQuery>;
