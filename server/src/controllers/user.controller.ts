import type { Request, Response } from "express";
import {
  createUserSchema,
  listUsersQuery,
  updateUserSchema,
} from "../schemas/user.schema.js";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "../services/user.service.js";

export const userController = {
  async list(req: Request, res: Response) {
    const query = listUsersQuery.parse(req.query);
    res.json(await listUsers(query));
  },

  async create(req: Request, res: Response) {
    const payload = createUserSchema.parse(req.body);
    const user = await createUser(payload, req.auth!.userId);
    res.status(201).json({ user });
  },

  async update(req: Request, res: Response) {
    const payload = updateUserSchema.parse(req.body);
    const user = await updateUser(
      String(req.params.id),
      payload,
      req.auth!.userId,
    );
    res.json({ user });
  },

  async remove(req: Request, res: Response) {
    const result = await deleteUser(String(req.params.id), req.auth!.userId);
    res.json(result);
  },
};
