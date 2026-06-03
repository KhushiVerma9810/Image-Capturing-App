import type { Request, Response } from "express";
import { loginSchema } from "../schemas/auth.schema.js";
import { buildAuthUser, login } from "../services/auth.service.js";
import { UserModel } from "../models/User.js";
import { AppError } from "../utils/app-error.js";

export const authController = {
  async login(req: Request, res: Response) {
    const credentials = loginSchema.parse(req.body);
    const result = await login(credentials);
    res.json(result);
  },

  async me(req: Request, res: Response) {
    const user = await UserModel.findById(req.auth!.userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    res.json({ user: await buildAuthUser(user) });
  },
};
