import type { Request, Response } from "express";
import {
  createPermissionSchema,
  listPermissionsQuery,
} from "../schemas/permission.schema.js";
import {
  createPermission,
  listPermissions,
} from "../services/permission.service.js";

export const permissionController = {
  async list(req: Request, res: Response) {
    const query = listPermissionsQuery.parse(req.query);
    res.json(await listPermissions({ ...query, includeHidden: false }));
  },

  async create(req: Request, res: Response) {
    const payload = createPermissionSchema.parse(req.body);
    const permission = await createPermission(payload, req.auth!.userId);
    res.status(201).json({ permission });
  },
};
