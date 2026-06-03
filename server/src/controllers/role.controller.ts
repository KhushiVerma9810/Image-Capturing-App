import type { Request, Response } from "express";
import { createRoleSchema, listRolesQuery } from "../schemas/role.schema.js";
import {
  createRole,
  listAssignableRoles,
  listRoles,
} from "../services/role.service.js";

export const roleController = {
  async list(req: Request, res: Response) {
    const query = listRolesQuery.parse(req.query);
    res.json(await listRoles({ ...query, includeHidden: false }));
  },

  async listAssignable(_req: Request, res: Response) {
    res.json({ roles: await listAssignableRoles() });
  },

  async create(req: Request, res: Response) {
    const payload = createRoleSchema.parse(req.body);
    const role = await createRole(payload, req.auth!.userId);
    res.status(201).json({ role });
  },
};
