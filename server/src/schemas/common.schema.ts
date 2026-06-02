import { z } from "zod";

/**
 * Coerces a query-string value into a trimmed, non-empty string or `undefined`.
 * Express may hand us an array (e.g. `?search=a&search=b`); anything that is not
 * a usable string collapses to `undefined` so list endpoints never 400 on it.
 */
export const searchParam = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined,
  z.string().optional(),
);

/**
 * Builds a paginated list query schema (`search` + `page` + `limit`) shared by
 * the users, roles, permissions, and images endpoints.
 */
export function listQuerySchema(options?: {
  defaultLimit?: number;
  maxLimit?: number;
}) {
  const defaultLimit = options?.defaultLimit ?? 10;
  const maxLimit = options?.maxLimit ?? 50;

  return z.object({
    search: searchParam,
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(maxLimit).default(defaultLimit),
  });
}
