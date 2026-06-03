import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { RoleModel } from "../models/Role.js";
import { UserModel } from "../models/User.js";

type TokenPayload = {
  sub: string;
  username: string;
  role: string;
};

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    const user = await UserModel.findById(payload.sub).lean();
    if (!user || !user.active) {
      next(
        new AppError(
          401,
          "Your account is inactive. Please contact your administrator.",
        ),
      );
      return;
    }

    req.auth = {
      userId: payload.sub,
      username: user.username,
      role: user.role,
    };

    const role = await RoleModel.findOne({ name: user.role }).lean();
    if (role) {
      req.auth.permissions = role.permissions ?? [];
    }

    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new AppError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      next(
        new AppError(403, "You do not have permission to perform this action"),
      );
      return;
    }

    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new AppError(401, "Authentication required"));
      return;
    }

    const permissions = req.auth.permissions ?? [];
    if (!permissions.includes(permission)) {
      next(
        new AppError(403, "You do not have permission to perform this action"),
      );
      return;
    }

    next();
  };
}
